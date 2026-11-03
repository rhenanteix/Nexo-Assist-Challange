import { calculateDueAt, isBusinessMinute, isOverdue } from './sla';
describe('SLA', () => {
    it('critical runs 24/7', () => expect(calculateDueAt('CRITICAL', new Date('2026-11-06T23:00:00Z')).toISOString()).toBe('2026-11-07T00:00:00.000Z'));
    it('high priority skips weekends', () => {
        const due = calculateDueAt('HIGH', new Date('2026-11-06T20:00:00Z'));
        expect(due.toISOString()).toBe('2026-11-09T14:00:00.000Z');
    });
    it('respects local business hours', () => expect(isBusinessMinute(new Date('2026-11-09T12:00:00Z'))).toBe(true));
    it('resolved is never overdue', () => expect(isOverdue({ dueAt: new Date('2020-01-01'), status: 'RESOLVED' })).toBe(false));
});
