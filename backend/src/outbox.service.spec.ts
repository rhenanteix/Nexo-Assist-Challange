import { OutboxService } from './outbox.service';

const event = { id: 'evt', conversationId: 'conv', ownerId: 'owner', type: 'message', attempts: 0 };
function setup(notify: jest.Mock) {
  const db = {
    outboxEvent: {
      findMany: jest.fn().mockResolvedValue([event]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  return { db, service: new OutboxService(db as never, { notify } as never) };
}

describe('OutboxService leased delivery', () => {
  it('claims and acknowledges a successfully emitted event', async () => {
    const notify = jest.fn();
    const { db, service } = setup(notify);
    await service.flush();
    expect(notify).toHaveBeenCalledWith('conv', 'owner', 'message');
    expect(db.outboxEvent.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ deliveredAt: expect.any(Date) }),
    }));
  });

  it('releases the lease with a retry date after failure', async () => {
    const { db, service } = setup(jest.fn(() => { throw new Error('offline'); }));
    await service.flush();
    expect(db.outboxEvent.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ nextAttemptAt: expect.any(Date), lockedBy: null }),
    }));
  });

  it('does not publish when another worker claimed the event', async () => {
    const notify = jest.fn();
    const { db, service } = setup(notify);
    db.outboxEvent.updateMany.mockResolvedValueOnce({ count: 0 });
    await service.flush();
    expect(notify).not.toHaveBeenCalled();
  });
});
