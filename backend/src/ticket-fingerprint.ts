import { createHash } from 'node:crypto';

/** Normalize accent, punctuation and spacing before deriving an owner-scoped identity. */
export function ticketFingerprint(ownerId: string, category: string, title: string): string {
  const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  return createHash('sha256').update(JSON.stringify([ownerId, category, normalized])).digest('hex');
}
