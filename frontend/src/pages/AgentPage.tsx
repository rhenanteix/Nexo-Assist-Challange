import { useEffect, useState } from 'react';
import { Composer } from '../components/Composer';
import { subscribeConversationUpdates } from '../api/realtime';
import { api, Conversation, patch, post, Ticket } from '../api/client';
export function AgentPage() {
    const [items, setItems] = useState<Conversation[]>([]);
    const [selected, setSelected] = useState<Conversation | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [error, setError] = useState('');
    async function load() { try {
        const [cs, ts] = await Promise.all([api<Conversation[]>('/conversations'), api<Ticket[]>('/tickets')]);
        setItems(cs);
        setTickets(ts);
        setSelected(s => cs.find(c => c.id === s?.id) || cs[0] || null);
    }
    catch (e) {
        setError(String(e));
    } }
    useEffect(() => { void load(); const unsubscribe = subscribeConversationUpdates(() => { void load(); }); const timer = setInterval(() => void load(), 30000); return () => { unsubscribe(); clearInterval(timer); }; }, []);
    async function transition(action: 'assign' | 'release' | 'close') { if (!selected)
        return; try {
        const c = await patch<Conversation>(`/conversations/${selected.id}/${action}`);
        setSelected(c);
        await load();
    }
    catch (e) {
        setError(String(e));
    } }
    async function reply(text: string) { if (!selected)
        return; try {
        const c = await post<Conversation>(`/conversations/${selected.id}/messages`, { text });
        setSelected(c);
        await load();
    }
    catch (e) {
        setError(String(e));
    } }
    return <main className="agent"><aside className="sidebar"><h2>Conversas</h2><div className="convos">{items.map(c => <button key={c.id} className={`convo ${selected?.id === c.id ? 'selected' : ''}`} onClick={() => setSelected(c)}><span className="convoinfo"><b>{c.owner.name}</b><small>{c.status}</small><em>{c.messages.at(-1)?.text.slice(0, 65)}</em></span></button>)}</div></aside><section className="agentmain">{selected ? <><div className="chathead"><b>{selected.owner.name}</b><span>{selected.status}</span><span className="grow"/>{selected.status === 'WAITING' && <button className="primary" onClick={() => transition('assign')}>Assumir</button>}{selected.status === 'ASSIGNED' && <><button className="secondary" onClick={() => transition('release')}>Devolver ao agente</button><button className="primary" onClick={() => transition('close')}>Encerrar</button></>}</div><div className="messages" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>{selected.messages.map(m => <div key={m.id} style={{ marginBottom: 16 }}><b>{m.role}</b><p>{m.text}</p>{m.actions && <details><summary>Decisão auditável</summary><pre>{JSON.stringify(JSON.parse(m.actions), null, 2)}</pre></details>}</div>)}</div><Composer onSend={reply} disabled={selected.status !== 'ASSIGNED'} placeholder="Assuma a conversa para responder"/></> : <p>Selecione uma conversa</p>}</section><aside className="details"><h3>Chamados do funcionário</h3>{tickets.filter(t => selected && t.ownerId === selected.ownerId).map(t => <div className="ticket" key={t.id}><b>{t.number}</b><p>{t.title}</p><small>{t.status}</small></div>)}{error && <p role="alert">{error}</p>}</aside></main>;
}
