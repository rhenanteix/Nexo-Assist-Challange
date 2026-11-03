import { useEffect, useState } from 'react';
import { Composer } from '../components/Composer';
import { subscribeConversationUpdates } from '../api/realtime';
import { api, Conversation, post, Ticket } from '../api/client';
export function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [current, setCurrent] = useState<Conversation | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [affected, setAffected] = useState('Só eu');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function load() { try {
        const [cs, ts] = await Promise.all([api<Conversation[]>('/conversations'), api<Ticket[]>('/tickets')]);
        setConversations(cs);
        setTickets(ts);
        setCurrent(c => cs.find(x => x.id === c?.id) || cs[0] || null);
    }
    catch (e) {
        setError(String(e));
    } }
    useEffect(() => { void load(); return subscribeConversationUpdates(() => { void load(); }); }, []);
    async function create() { try {
        const c = await post<Conversation>('/conversations');
        await load();
        setCurrent({ ...c, owner: { name: '', email: '' }, messages: [] });
    }
    catch (e) {
        setError(String(e));
    } }
    async function send(text: string) { if (!current)
        return; setBusy(true); setError(''); try {
        const c = await post<Conversation>(`/conversations/${current.id}/messages`, { text });
        setCurrent(c);
        await load();
        setCurrent(c);
    }
    catch (e) {
        setError(String(e));
    }
    finally {
        setBusy(false);
    } }
    async function confirm() { if (!current)
        return; setBusy(true); try {
        const c = await post<Conversation>(`/conversations/${current.id}/confirm`, { affected });
        setCurrent(c);
        await load();
        setCurrent(c);
    }
    catch (e) {
        setError(String(e));
    }
    finally {
        setBusy(false);
    } }
    const last = current?.messages.at(-1);
    const canConfirm = last?.role === 'agent' && last.text.includes('rascunho');
    return <main className="chatpage"><div className="chatintro"><div className="eyebrow">Service desk de TI</div><h1>Como podemos ajudar?</h1><span className="online">● Assistente conectado ao backend</span></div><div className="choices"><button onClick={create}>+ Nova conversa</button>{conversations.map(c => <button key={c.id} onClick={() => setCurrent(c)}>{new Date(c.createdAt || Date.now()).toLocaleDateString('pt-BR')} · {c.status}</button>)}</div><div className="messages" style={{ minHeight: 240, overflowY: 'auto', padding: 16 }}>{current?.messages.map(m => <div key={m.id} style={{ margin: '12px 0', textAlign: m.role === 'user' ? 'right' : 'left' }}><strong>{m.role === 'agent' ? 'Nexo Assist' : 'Você'}</strong><p>{m.text}</p>{m.actions && <details><summary>Ver decisões do agente</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(JSON.parse(m.actions), null, 2)}</pre></details>}</div>)}{!current && <p>Crie uma conversa para começar.</p>}</div>{canConfirm && <div className="draft"><label>Quem está sendo afetado? <select value={affected} onChange={e => setAffected(e.target.value)}><option>Só eu</option><option>Minha equipe</option><option>Toda a empresa</option></select></label><button className="primary" onClick={confirm} disabled={busy}>Confirmar abertura do chamado</button></div>}<Composer onSend={send} disabled={!current || current.status !== 'AGENT' || busy} placeholder={busy ? 'Processando…' : current?.status !== 'AGENT' ? 'Agente pausado' : 'Descreva sua solicitação de TI…'}/><h3>Meus chamados</h3><div className="ticketlist">{tickets.map(t => <div className="ticketoption" key={t.id}><b>{t.number}</b> · {t.title} · {t.status} {new Date(t.dueAt) < new Date() && t.status !== 'RESOLVED' ? '· Vencido' : ''}</div>)}</div>{error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}</main>;
}
