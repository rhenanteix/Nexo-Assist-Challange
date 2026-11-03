import { ticketFingerprint } from './ticket-fingerprint';

describe('ticket fingerprint', () => {
  it('normalizes punctuation and accents', () => {
    expect(ticketFingerprint('u1', 'Hardware', 'Notebook LÉNTO!'))
      .toBe(ticketFingerprint('u1', 'Hardware', 'notebook lento'));
  });
  it('never mixes employees or categories', () => {
    expect(ticketFingerprint('u1', 'Hardware', 'VPN'))
      .not.toBe(ticketFingerprint('u2', 'Hardware', 'VPN'));
    expect(ticketFingerprint('u1', 'Hardware', 'VPN'))
      .not.toBe(ticketFingerprint('u1', 'Rede e VPN', 'VPN'));
  });
});
