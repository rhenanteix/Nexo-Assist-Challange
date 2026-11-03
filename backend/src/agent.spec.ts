import { Test } from '@nestjs/testing';
import { AgentService } from './agent';
import { PrismaService } from './prisma.service';
import { TicketsService } from './tickets';
describe('AgentService', () => {
    it('instancia o serviço com dependências isoladas', async () => {
        const module = await Test.createTestingModule({ providers: [AgentService, { provide: PrismaService, useValue: {} }, { provide: TicketsService, useValue: {} }] }).compile();
        expect(module.get(AgentService)).toBeDefined();
    });
});
