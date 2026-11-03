import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EventsGateway } from './events.gateway';

/** Database-backed leased dispatcher. Events are at-least-once; clients refetch on notification. */
@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxService.name);
  private readonly workerId = randomUUID();
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(private readonly db: PrismaService, private readonly gateway: EventsGateway) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.flush(), 1000);
    void this.flush();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async flush(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const now = new Date();
      const candidates = await this.db.outboxEvent.findMany({
        where: {
          deliveredAt: null,
          attempts: { lt: 20 },
          OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
          AND: [{ OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] }],
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });
      for (const candidate of candidates) {
        const claim = await this.db.outboxEvent.updateMany({
          where: {
            id: candidate.id,
            deliveredAt: null,
            OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
          },
          data: { lockedBy: this.workerId, lockedUntil: new Date(Date.now() + 30000), attempts: { increment: 1 } },
        });
        if (claim.count !== 1) continue;
        try {
          this.gateway.notify(candidate.conversationId, candidate.ownerId, candidate.type);
          await this.db.outboxEvent.updateMany({
            where: { id: candidate.id, lockedBy: this.workerId },
            data: { deliveredAt: new Date(), lockedBy: null, lockedUntil: null },
          });
        } catch (error) {
          const delayMs = Math.min(60000, 1000 * 2 ** Math.min(candidate.attempts, 6));
          await this.db.outboxEvent.updateMany({
            where: { id: candidate.id, lockedBy: this.workerId },
            data: { lockedBy: null, lockedUntil: null, nextAttemptAt: new Date(Date.now() + delayMs) },
          });
          this.logger.warn(`Outbox event ${candidate.id} failed: ${String(error)}`);
        }
      }
    } catch (error) {
      this.logger.error(`Outbox polling failed: ${String(error)}`);
    } finally {
      this.running = false;
    }
  }
}
