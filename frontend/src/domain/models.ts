export type MessageSender = 'user' | 'bot' | 'agent';
export interface Message {
    id: string;
    sender: MessageSender;
    text: string;
    createdAt: string;
}
export type TicketStatus = 'Aguardando analista' | 'Em andamento' | 'Aprovado' | 'Resolvido';
export interface Ticket {
    id: string;
    title: string;
    status: TicketStatus;
    category: string;
    priority: 'Baixa' | 'Média' | 'Alta';
    description: string;
    affected?: string;
}
export interface Conversation {
    id: string;
    name: string;
    initials: string;
    preview: string;
    status: string;
    unread: number;
    assigned: boolean;
    messages: Message[];
}
export interface Session {
    name: string;
    email: string;
}
