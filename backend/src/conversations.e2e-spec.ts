import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { ConversationsController, ConversationsService } from './conversations';
import { JwtGuard } from './auth';

/** HTTP contract tests: validation, authentication, and routing. */
describe('Conversations HTTP contract', () => {
  let app: INestApplication;
  const service = {
    list: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'test-conversation', status: 'AGENT' }),
    one: jest.fn().mockResolvedValue({ id: 'test-conversation', status: 'AGENT' }),
    send: jest.fn().mockResolvedValue({ id: 'test-conversation', messages: [] }),
    confirm: jest.fn().mockResolvedValue({ id: 'test-conversation', confirmation: { replayed: false } }),
    transition: jest.fn(),
  };
  const jwt = new JwtService({ secret: 'test-secret' });
  let token: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        JwtGuard,
        { provide: JwtService, useValue: jwt },
        { provide: ConversationsService, useValue: service },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
    token = await jwt.signAsync({ sub: 'employee-1', role: 'EMPLOYEE', email: 'a@nexo.com.br' });
  });

  afterAll(async () => { await app.close(); });

  it('rejects requests without JWT', async () => {
    await request(app.getHttpServer()).get('/conversations').expect(401);
  });

  it('accepts authenticated requests', async () => {
    await request(app.getHttpServer()).get('/conversations').set('Authorization', `Bearer ${token}`).expect(200);
  });

  it('rejects empty messages', async () => {
    await request(app.getHttpServer()).post('/conversations/test-conversation/messages')
      .set('Authorization', `Bearer ${token}`).send({ text: '' }).expect(400);
  });

  it('requires a supported affected scope before confirmation', async () => {
    await request(app.getHttpServer()).post('/conversations/test-conversation/confirm')
      .set('Authorization', `Bearer ${token}`).send({ affected: 'everyone' }).expect(400);
  });
});
