import type { Conversation, Message, Ticket } from '../domain/models';
const at = '2026-10-29T13:00:00.000Z';
export const initialTickets: Ticket[] = [
    { id: 'INC-20311', title: 'Notebook lento após atualização', status: 'Aguardando analista', category: 'Hardware › Notebook', priority: 'Média', description: 'Lentidão geral desde a atualização de 15/10.' },
    { id: 'INC-20298', title: 'Acesso à pasta Financeiro no SharePoint', status: 'Em andamento', category: 'Acessos', priority: 'Média', description: 'Solicitação de acesso à pasta do departamento.' },
    { id: 'REQ-10442', title: 'Segundo monitor para home office', status: 'Aprovado', category: 'Equipamentos', priority: 'Baixa', description: 'Solicitação de monitor adicional.' },
];
export const welcome: Message[] = [{ id: 'welcome', sender: 'bot', text: 'Olá! Sou o Nexo Assist. Como posso ajudar você hoje?', createdAt: at }];
const conversationMessages: Message[] = [
    { id: 'c1', sender: 'user', text: 'Qual o status do meu chamado?', createdAt: at },
    { id: 'c2', sender: 'bot', text: 'Você tem 3 chamados registrados. Sobre qual deles quer saber?', createdAt: at },
    { id: 'c3', sender: 'user', text: 'INC-20311 · Notebook lento após atualização', createdAt: at },
    { id: 'c4', sender: 'bot', text: 'Está sem atualização há 5 dias. Quer que eu chame um analista?', createdAt: at },
    { id: 'c5', sender: 'user', text: 'Quero falar com um analista.', createdAt: at },
];
export const initialConversations: Conversation[] = [
    { id: 'ana', name: 'Ana Souza', initials: 'AS', preview: 'Quero falar com um analista.', status: 'Transferida · INC-20311', unread: 2, assigned: false, messages: conversationMessages },
    { id: 'carla', name: 'Carla Mendes', initials: 'CM', preview: 'Preciso de acesso ao SAP ainda hoje', status: 'Transferida · contato em 25 min', unread: 1, assigned: false, messages: [{ id: 'c6', sender: 'user', text: 'Preciso de acesso ao SAP ainda hoje', createdAt: at }] },
    { id: 'bruno', name: 'Bruno Tavares', initials: 'BT', preview: 'Vou chamar um analista para isso.', status: 'Agent pediu ajuda', unread: 0, assigned: false, messages: [] },
    { id: 'diego', name: 'Diego Ramos', initials: 'DR', preview: 'Aguardando resposta', status: 'Agent atendendo', unread: 0, assigned: false, messages: [] },
    { id: 'elisa', name: 'Elisa Prado', initials: 'EP', preview: 'Chamado INC-20519 criado.', status: 'Agent atendendo', unread: 0, assigned: false, messages: [] },
    { id: 'fabio', name: 'Fábio Nunes', initials: 'FN', preview: 'Isso resolveu, obrigado!', status: 'Resolvida pelo agent', unread: 0, assigned: false, messages: [] },
    { id: 'gabriela', name: 'Gabriela Rocha', initials: 'GR', preview: 'A senha do Wi-Fi foi enviada…', status: 'Resolvida pelo agent', unread: 0, assigned: false, messages: [] },
];
