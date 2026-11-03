import { ticketFingerprint } from './ticket-fingerprint';
import { randomUUID } from 'node:crypto';
import { calculateDueAt, Priority } from './sla';
import { Body, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength, MaxLength, IsIn } from 'class-validator';
import { PrismaService } from './prisma.service';
import { AgentService } from './agent';
import { EventsGateway } from './events.gateway';
import { TicketsService, TicketDto } from './tickets';
import { CurrentUser, JwtGuard, Principal } from './auth';
export class SendDto {
    @IsString()
    @MinLength(1)
    @MaxLength(3000)
    text!: string;
}
export class ConfirmDto {
    @IsIn(['Só eu', 'Minha equipe', 'Toda a empresa'])
    affected!: string;
}
@Injectable()
export class ConversationsService {
    constructor(private db: PrismaService, private agent: AgentService, private tickets: TicketsService, private events: EventsGateway) { }
    list(user: Principal) { return this.db.conversation.findMany({ where: user.role === 'EMPLOYEE' ? { ownerId: user.sub } : {}, include: { owner: { select: { name: true, email: true } }, messages: { orderBy: { createdAt: 'asc' } } }, orderBy: { updatedAt: 'desc' } }); }
    async one(id: string, user: Principal) {
        const convo = await this.db.conversation.findUnique({ where: { id }, include: { owner: { select: { name: true, email: true } }, messages: { orderBy: { createdAt: 'asc' } } } });
        if (!convo)
            throw new NotFoundException('Conversa não encontrada');
        if (user.role === 'EMPLOYEE' && convo.ownerId !== user.sub)
            throw new ForbiddenException();
        return convo;
    }
    create(user: Principal) { if (user.role !== 'EMPLOYEE')
        throw new ForbiddenException(); return this.db.conversation.create({ data: { ownerId: user.sub } }); }
    async send(id: string, text: string, user: Principal) {
        const convo = await this.one(id, user);
        if (convo.status === 'CLOSED')
            throw new ForbiddenException('Conversa encerrada');
        if (convo.messageCount >= 30)
            throw new ForbiddenException('Limite de 30 mensagens atingido');
        if (user.role !== 'EMPLOYEE' && (convo.status !== 'ASSIGNED' || convo.assignedToId !== user.sub))
            throw new ForbiddenException('Assuma a conversa antes de responder');
        if (user.role === 'EMPLOYEE' && convo.status !== 'AGENT')
            throw new ForbiddenException('O agente está pausado durante o atendimento humano');
        const updated = await this.db.conversation.updateMany({ where: { id, messageCount: { lt: 30 }, status: convo.status }, data: { messageCount: { increment: 1 } } });
        if (updated.count !== 1)
            throw new ForbiddenException('Limite de mensagens ou estado alterado');
        await this.db.message.create({ data: { conversationId: id, authorId: user.sub, role: user.role === 'EMPLOYEE' ? 'user' : 'analyst', text } });
        if (user.role !== 'EMPLOYEE') {
            await this.db.outboxEvent.create({ data: { conversationId: id, ownerId: convo.ownerId, type: 'analyst:message' } });
            return this.one(id, user);
        }
        // Confirmation requires explicit POST /confirm with affected field; chat text alone cannot mutate tickets.
        const result = await this.agent.respond(id, text, user);
        if (result.draft)
            await this.db.draft.upsert({ where: { conversationId: id }, create: { conversationId: id, payload: JSON.stringify(result.draft), intent: 'CREATE' }, update: { payload: JSON.stringify(result.draft) } });
        await this.db.message.create({ data: { conversationId: id, role: 'agent', text: result.reply, actions: JSON.stringify(result.actions) } });
        if (result.transfer)
            await this.db.conversation.update({ where: { id }, data: { status: 'WAITING', summary: text.slice(0, 500) } });
        await this.db.outboxEvent.create({ data: { conversationId: id, ownerId: convo.ownerId, type: result.transfer ? 'transfer' : 'message' } });
        return this.one(id, user);
    }
    async confirm(id: string, dto: ConfirmDto, user: Principal) {
        const convo = await this.one(id, user);
        if (user.role !== 'EMPLOYEE' || convo.status !== 'AGENT')
            throw new ForbiddenException();
        // All state mutations are atomic; a unique operation per draft is the idempotency fence.
        // No external service calls are made inside the transaction.
        const outcome = await this.db.$transaction(async (tx) => {
            const draft = await tx.draft.findUnique({ where: { conversationId: id } });
            if (!draft) {
                const previous = await tx.ticketOperation.findFirst({
                    where: { conversationId: id, actorId: user.sub },
                    orderBy: { createdAt: 'desc' },
                });
                if (previous) return { ticketId: previous.ticketId, replayed: true };
                throw new NotFoundException('Nenhum rascunho aguardando confirmação');
            }
            const payload = JSON.parse(draft.payload) as TicketDto;
            const existing = await tx.ticket.findFirst({
                where: { ownerId: user.sub, category: payload.category, OR: [{ fingerprint: ticketFingerprint(user.sub, payload.category, payload.title) }, { title: payload.title }],
                    AND: [{ OR: [{ status: { in: ['OPEN', 'PENDING', 'APPROVED'] } },
                        { status: 'RESOLVED', resolvedAt: { gte: new Date(Date.now() - 7 * 86400000) } }] }] },
                orderBy: { updatedAt: 'desc' },
            });
            let ticketId: string;
            if (existing) {
                const updated = await tx.ticket.update({
                    where: { id: existing.id },
                    data: { description: `${existing.description}\n\nComplemento: ${payload.description}`,
                        status: 'OPEN', resolvedAt: null },
                });
                ticketId = updated.id;
            } else {
                const ticket = await tx.ticket.create({
                    data: { ...payload, affected: dto.affected, ownerId: user.sub,
                        number: `${payload.type}-${randomUUID().slice(0, 8).toUpperCase()}`,
                        fingerprint: ticketFingerprint(user.sub, payload.category, payload.title),
                        dueAt: calculateDueAt(payload.priority as Priority) },
                });
                ticketId = ticket.id;
            }
            await tx.ticketOperation.create({ data: { conversationId: id, draftId: draft.id, ticketId, actorId: user.sub } });
            await tx.draft.delete({ where: { id: draft.id } });
            await tx.message.create({ data: { conversationId: id, role: 'agent',
                text: existing ? 'Chamado existente atualizado após confirmação.' : 'Chamado criado após confirmação.',
                actions: JSON.stringify({ confirmed: true, ticketId, duplicate: !!existing }) } });
            await tx.audit.create({ data: { actorId: user.sub, action: 'TICKET_CONFIRMED',
                entityId: ticketId, metadata: JSON.stringify({ conversationId: id, draftId: draft.id }) } });
            await tx.outboxEvent.create({ data: { conversationId: id, ownerId: convo.ownerId, type: 'ticket:confirmed' } });
            return { ticketId, replayed: false };
        });
        return { ...(await this.one(id, user)), confirmation: outcome };
    }
    async transition(id: string, action: 'assign' | 'release' | 'close', user: Principal) {
        if (user.role === 'EMPLOYEE')
            throw new ForbiddenException('Apenas analistas');
        const convo = await this.one(id, user);
        if (action === 'assign' && convo.status !== 'WAITING')
            throw new ForbiddenException('Conversa não está na fila');
        if (action !== 'assign' && (convo.status !== 'ASSIGNED' || convo.assignedToId !== user.sub))
            throw new ForbiddenException('Conversa atribuída a outro analista');
        const status = action === 'assign' ? 'ASSIGNED' : action === 'release' ? 'AGENT' : 'CLOSED';
        const changed = await this.db.conversation.updateMany({ where: { id, status: convo.status, assignedToId: convo.assignedToId }, data: { status, assignedToId: action === 'assign' ? user.sub : null } });
        if (changed.count !== 1)
            throw new ForbiddenException('Outro analista alterou esta conversa');
        await this.db.audit.create({ data: { actorId: user.sub, action: `CONVERSATION_${action.toUpperCase()}`, entityId: id, metadata: '{}' } });
        await this.db.outboxEvent.create({ data: { conversationId: id, ownerId: convo.ownerId, type: `conversation:${action}` } });
        return this.one(id, user);
    }
}
@UseGuards(JwtGuard)
@Controller('conversations')
export class ConversationsController {
    constructor(private service: ConversationsService) { }
    @Get()
    list(
    @CurrentUser()
    u: Principal) { return this.service.list(u); }
    @Post()
    create(
    @CurrentUser()
    u: Principal) { return this.service.create(u); }
    @Get(':id')
    one(
    @Param('id')
    id: string, 
    @CurrentUser()
    u: Principal) { return this.service.one(id, u); }
    @Post(':id/messages')
    send(
    @Param('id')
    id: string, 
    @Body()
    dto: SendDto, 
    @CurrentUser()
    u: Principal) { return this.service.send(id, dto.text, u); }
    @Post(':id/confirm')
    confirm(
    @Param('id')
    id: string, 
    @Body()
    dto: ConfirmDto, 
    @CurrentUser()
    u: Principal) { return this.service.confirm(id, dto, u); }
    @Patch(':id/assign')
    assign(
    @Param('id')
    id: string, 
    @CurrentUser()
    u: Principal) { return this.service.transition(id, 'assign', u); }
    @Patch(':id/release')
    release(
    @Param('id')
    id: string, 
    @CurrentUser()
    u: Principal) { return this.service.transition(id, 'release', u); }
    @Patch(':id/close')
    close(
    @Param('id')
    id: string, 
    @CurrentUser()
    u: Principal) { return this.service.transition(id, 'close', u); }
}
