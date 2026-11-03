export const now = () => new Date().toISOString();
export const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
export const newId = () => crypto.randomUUID();
