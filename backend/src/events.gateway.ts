import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from './prisma.service';
import { Principal } from './auth';
@WebSocketGateway({ namespace: '/events', cors: { origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' } })
@Injectable()
export class EventsGateway implements OnGatewayConnection {
    @WebSocketServer()
    server!: Server;
    constructor(private jwt: JwtService, private db: PrismaService) { }
    async handleConnection(client: Socket) {
        try {
            const token = String(client.handshake.auth?.token || '');
            const principal = await this.jwt.verifyAsync<Principal>(token);
            client.data.principal = principal;
            client.join(`user:${principal.sub}`);
            if (principal.role === 'ANALYST')
                client.join('analysts');
        }
        catch {
            client.disconnect(true);
        }
    }
    @SubscribeMessage('conversation:join')
    async join(
    @ConnectedSocket()
    client: Socket, 
    @MessageBody()
    id: string) {
        const user = client.data.principal as Principal | undefined;
        if (!user || typeof id !== 'string' || id.length > 128)
            return { ok: false };
        const conversation = await this.db.conversation.findUnique({ where: { id }, select: { ownerId: true, assignedToId: true } });
        if (!conversation || (user.role === 'EMPLOYEE' && conversation.ownerId !== user.sub))
            return { ok: false };
        client.join(`conversation:${id}`);
        return { ok: true };
    }
    notify(id: string, ownerId: string, type: string) {
        this.server?.to(`conversation:${id}`).to(`user:${ownerId}`).to('analysts').emit('conversation:changed', { id, type });
    }
}
