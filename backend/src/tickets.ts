import { randomUUID } from 'node:crypto';
import { ticketFingerprint } from './ticket-fingerprint';
import { Body, Controller, ForbiddenException, Get, Injectable, Param, Patch, Post, UseGuards, NotFoundException } from '@nestjs/common';
import { IsIn, IsString, MinLength, MaxLength } from 'class-validator';
import { PrismaService } from './prisma.service';
import { calculateDueAt, Priority } from './sla';
import { LegacyAvailabilityService } from './legacy';
import { CurrentUser, JwtGuard, Principal } from './auth';
export class TicketDto {
    @IsString()
    @MinLength(3)
    @MaxLength(120)
    title!: string;
    @IsString()
    @MinLength(5)
    @MaxLength(3000)
    description!: string;
    @IsIn(['INC', 'REQ'])
    type!: string;
    @IsIn(['Acesso', 'Rede e VPN', 'Hardware', 'Software', 'E-mail', 'Outros'])
    category!: string;
    @IsIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
    priority!: string;
    @IsIn(['Só eu', 'Minha equipe', 'Toda a empresa'])
    affected!: string;
}
export class UpdateTicketDto {
    @IsString()
    @MinLength(2)
    @MaxLength(3000)
    description!: string;
}
@Injectable()
export class TicketsService {
    constructor(private db: PrismaService, private legacy: LegacyAvailabilityService) { }
    list(user: Principal) { return this.legacy.execute(() => this.db.ticket.findMany({ where: user.role === 'EMPLOYEE' ? { ownerId: user.sub } : {}, orderBy: { updatedAt: 'desc' } }), true); }
    async one(id: string, user: Principal) {
        const ticket = await this.legacy.execute(() => this.db.ticket.findUnique({ where: { id } }), true);
        if (!ticket)
            throw new NotFoundException('Chamado não encontrado');
        if (user.role === 'EMPLOYEE' && ticket.ownerId !== user.sub)
            throw new ForbiddenException('Chamado de outro funcionário');
        return ticket;
    }
    async create(dto: TicketDto, user: Principal) {
        const existing = await this.legacy.execute(() => this.db.ticket.findFirst({ where: { ownerId: user.sub, status: { in: ['OPEN', 'PENDING', 'APPROVED'] }, category: dto.category, title: dto.title }, orderBy: { updatedAt: 'desc' } }), true);
        if (existing) {
            const updated = await this.update(existing.id, { description: dto.description }, user);
            return { ticket: updated, duplicate: true };
        }
        const recent = await this.db.ticket.findFirst({ where: { ownerId: user.sub, status: 'RESOLVED', category: dto.category, title: dto.title, resolvedAt: { gte: new Date(Date.now() - 7 * 86400000) } } });
        if (recent) {
            const updated = await this.update(recent.id, { description: dto.description }, user);
            return { ticket: updated, duplicate: true };
        }
        
        const ticket = await this.legacy.execute(() => this.db.ticket.create({ data: { ...dto, ownerId: user.sub, number: `${dto.type}-${randomUUID().slice(0, 8).toUpperCase()}`, fingerprint: ticketFingerprint(user.sub, dto.category, dto.title), dueAt: calculateDueAt(dto.priority as Priority) } }));
        await this.db.audit.create({ data: { actorId: user.sub, action: 'TICKET_CREATED', entityId: ticket.id, metadata: JSON.stringify(dto) } });
        return { ticket, duplicate: false };
    }
    async update(id: string, dto: UpdateTicketDto, user: Principal) {
        const ticket = await this.one(id, user);
        if (ticket.status === 'RESOLVED' && (!ticket.resolvedAt || Date.now() - ticket.resolvedAt.getTime() > 7 * 86400000))
            throw new ForbiddenException('Prazo para reabertura expirado');
        const updated = await this.legacy.execute(() => this.db.ticket.update({ where: { id }, data: { description: `${ticket.description}

Complemento: ${dto.description}`, status: 'OPEN', resolvedAt: null, dueAt: calculateDueAt(ticket.priority as Priority) } }));
        await this.db.audit.create({ data: { actorId: user.sub, action: 'TICKET_UPDATED', entityId: id, metadata: JSON.stringify(dto) } });
        return updated;
    }
}
@UseGuards(JwtGuard)
@Controller('tickets')
export class TicketsController {
    constructor(private service: TicketsService) { }
    @Get()
    list(
    @CurrentUser()
    user: Principal) { return this.service.list(user); }
    @Get(':id')
    one(
    @Param('id')
    id: string, 
    @CurrentUser()
    user: Principal) { return this.service.one(id, user); }
    @Post()
    create(
    @Body()
    dto: TicketDto, 
    @CurrentUser()
    user: Principal) { return this.service.create(dto, user); }
    @Patch(':id')
    update(
    @Param('id')
    id: string, 
    @Body()
    dto: UpdateTicketDto, 
    @CurrentUser()
    user: Principal) { return this.service.update(id, dto, user); }
}
