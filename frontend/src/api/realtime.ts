import { io, Socket } from 'socket.io-client';
import { session } from './client';
export function subscribeConversationUpdates(onChange: (id: string) => void): () => void {
    const token = session.token;
    if (!token)
        return () => undefined;
    const origin = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');
    const socket: Socket = io(`${origin}/events`, { auth: { token }, transports: ['websocket'], reconnection: true });
    socket.on('conversation:changed', (event: {
        id: string;
    }) => onChange(event.id));
    return () => socket.disconnect();
}
