import { MastraClassifier } from './mastra-classifier';
import { OutboxService } from './outbox.service';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from './prisma.service';
import { LegacyAvailabilityService } from './legacy';
import { EventsGateway } from './events.gateway';
import { AuthController, AuthService, JwtGuard } from './auth';
import { TicketsController, TicketsService } from './tickets';
import { AgentService } from './agent';
import { ConversationsController, ConversationsService } from './conversations';
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), JwtModule.registerAsync({ global: true, inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.get<string>('JWT_SECRET') || 'demo-only-change-before-deployment', signOptions: { expiresIn: '8h' } }) }), ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])], controllers: [AuthController, TicketsController, ConversationsController], providers: [PrismaService, LegacyAvailabilityService, EventsGateway, OutboxService, AuthService, JwtGuard, TicketsService, MastraClassifier, AgentService, ConversationsService, { provide: APP_GUARD, useClass: ThrottlerGuard }] })
export class AppModule {
}
