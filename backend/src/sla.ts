/** Service desk business hours: Monday-Friday, 08:00-18:00, America/Sao_Paulo. */
export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
const businessMinutes: Record<Priority, number> = { CRITICAL: 60, HIGH: 240, MEDIUM: 3 * 10 * 60, LOW: 5 * 10 * 60 };
const zone = 'America/Sao_Paulo';
function localParts(date: Date) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(date);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
    return { day: get('weekday'), hour: Number(get('hour')), minute: Number(get('minute')) };
}
export function isBusinessMinute(date: Date): boolean {
    const { day, hour } = localParts(date);
    return day !== 'Sat' && day !== 'Sun' && hour >= 8 && hour < 18;
}
/** Minute iteration makes DST/time-zone changes explicit and testable. Holidays are not modeled. */
export function calculateDueAt(priority: Priority, start: Date = new Date()): Date {
    const remaining = businessMinutes[priority];
    if (!remaining)
        throw new Error('Invalid priority');
    if (priority === 'CRITICAL')
        return new Date(start.getTime() + remaining * 60000);
    const cursor = new Date(start);
    let consumed = 0;
    while (consumed < remaining) {
        cursor.setTime(cursor.getTime() + 60000);
        if (isBusinessMinute(cursor))
            consumed += 1;
    }
    return cursor;
}
export function isOverdue(ticket: {
    dueAt: Date;
    status: string;
}, now = new Date()): boolean {
    return !['RESOLVED', 'CLOSED'].includes(ticket.status) && ticket.dueAt.getTime() < now.getTime();
}
