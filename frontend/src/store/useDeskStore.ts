import { create } from 'zustand';
import type { Conversation, Message, Session, Ticket } from '../domain/models';
import { initialConversations, initialTickets, welcome } from '../data/seed';
import { newId, now } from '../shared/format';
import { loadJson, saveJson } from '../shared/storage';
interface DeskState {
    session: Session | null;
    tickets: Ticket[];
    messages: Message[];
    conversations: Conversation[];
    login: (email: string) => void;
    logout: () => void;
    addMessage: (sender: Message['sender'], text: string) => void;
    createTicket: (data: Pick<Ticket, 'title' | 'description' | 'affected'>) => Ticket;
    assignConversation: (id: string) => void;
    resolveConversation: (id: string) => void;
    replyConversation: (id: string, text: string) => void;
}
const stored = loadJson<Pick<DeskState, 'session' | 'tickets' | 'messages' | 'conversations'>>('nexo-desk-v2', {
    session: null, tickets: initialTickets, messages: welcome, conversations: initialConversations,
});
export const useDeskStore = create<DeskState>((set, get) => ({
    ...stored,
    login: (email) => set({ session: { name: 'Ana Souza', email } }),
    logout: () => set({ session: null }),
    addMessage: (sender, text) => set((state) => ({ messages: [...state.messages, { id: newId(), sender, text, createdAt: now() }] })),
    createTicket: (data) => {
        const tickets = get().tickets;
        const highest = Math.max(20516, ...tickets.map((ticket) => Number(ticket.id.match(/^INC-(\d+)$/)?.[1] ?? 0)));
        const ticket: Ticket = { ...data, id: `INC-${highest + 1}`, category: /vpn|rede|internet/i.test(data.description) ? 'Rede e VPN' : 'Suporte de TI', priority: 'Alta', status: 'Aguardando analista' };
        set({ tickets: [ticket, ...tickets] });
        return ticket;
    },
    assignConversation: (id) => set((state) => ({ conversations: state.conversations.map((c) => c.id === id ? { ...c, assigned: true, status: 'Em atendimento', unread: 0 } : c) })),
    resolveConversation: (id) => set((state) => ({ conversations: state.conversations.map((c) => c.id === id ? { ...c, assigned: false, status: 'Resolvida', unread: 0 } : c) })),
    replyConversation: (id, text) => set((state) => ({ conversations: state.conversations.map((c) => c.id === id ? { ...c, preview: text, messages: [...c.messages, { id: newId(), sender: 'agent', text, createdAt: now() }] } : c) })),
}));
useDeskStore.subscribe((state) => saveJson('nexo-desk-v2', { session: state.session, tickets: state.tickets, messages: state.messages, conversations: state.conversations }));
