const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export type User = {
    id: string;
    name: string;
    email: string;
    role: 'EMPLOYEE' | 'ANALYST';
};
export type Ticket = {
    ownerId: string;
    id: string;
    number: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    dueAt: string;
    category: string;
};
export type Message = {
    id: string;
    role: string;
    text: string;
    actions: string | null;
    createdAt: string;
};
export type Conversation = {
    id: string;
    status: string;
    ownerId: string;
    owner: {
        name: string;
        email: string;
    };
    messages: Message[];
    assignedToId: string | null;
    createdAt: string;
};
export const session = {
    get token() { return sessionStorage.getItem('nexo-token'); },
    get user(): User | null { const s = sessionStorage.getItem('nexo-user'); return s ? JSON.parse(s) as User : null; },
    save(token: string, user: User) { sessionStorage.setItem('nexo-token', token); sessionStorage.setItem('nexo-user', JSON.stringify(user)); },
    clear() { sessionStorage.removeItem('nexo-token'); sessionStorage.removeItem('nexo-user'); },
};
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}), ...init.headers } });
    if (!response.ok) {
        const body = await response.json().catch(() => ({})) as {
            message?: string | string[];
        };
        throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message || `Erro HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
}
export const post = <T>(path: string, data: object = {}) => api<T>(path, { method: 'POST', body: JSON.stringify(data) });
export const patch = <T>(path: string) => api<T>(path, { method: 'PATCH' });
