import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Composer } from '../components/Composer';
import { MessageList } from '../components/MessageList';
import { useDeskStore } from '../store/useDeskStore';
type Filter = 'Todas' | 'Para você' | 'Com o agent' | 'Minhas';
export function AgentPage() {
  const conversations = useDeskStore((s) => s.conversations);
  const assign = useDeskStore((s) => s.assignConversation);
  const resolve = useDeskStore((s) => s.resolveConversation);
  const reply = useDeskStore((s) => s.replyConversation);
  const [selectedId, setSelectedId] = useState('ana');
  const [filter, setFilter] = useState<Filter>('Todas');
  const [search, setSearch] = useState('');
  const selected = conversations.find((c) => c.id === selectedId);
  const visible = useMemo(() => conversations.filter((c) => `${c.name} ${c.status} ${c.preview}`.toLowerCase().includes(search.toLowerCase())).filter((c) => filter === 'Todas' || (filter === 'Para você' && /Transferida|pediu ajuda/.test(c.status)) || (filter === 'Com o agent' && /Agent atendendo/.test(c.status)) || (filter === 'Minhas' && c.assigned)), [conversations, search, filter]);
  return <main className="agent"><aside className="sidebar"><div className="sidehead"><h2>Conversas</h2><span className="online">● Disponível</span></div><label className="search"><Search size={17}/><input aria-label="Pesquisar conversas" placeholder="Pesquisar conversa" value={search} onChange={(e) => setSearch(e.target.value)}/></label><div className="tabs">{(['Todas', 'Para você', 'Com o agent', 'Minhas'] as const).map((tab) => <button key={tab} className={filter === tab ? 'active' : ''} onClick={() => setFilter(tab)}>{tab}</button>)}</div><div className="convos">{visible.map((c) => <button key={c.id} className={`convo ${selectedId === c.id ? 'selected' : ''}`} onClick={() => setSelectedId(c.id)}><span className="avatar">{c.initials}</span><span className="convoinfo"><b>{c.name}</b><small>{c.preview}</small><em>{c.status}</em></span>{c.unread > 0 && <span className="count">{c.unread}</span>}</button>)}</div></aside>
    <section className="agentmain">{selected ? <><div className="chathead"><span className="avatar">{selected.initials}</span><div><b>{selected.name}</b><small>{selected.status}</small></div><span className="grow"/>{!selected.assigned && selected.status !== 'Resolvida' && <button className="primary" onClick={() => assign(selected.id)}>Assumir</button>}{selected.assigned && <button className="secondary" onClick={() => resolve(selected.id)}>Resolver</button>}</div><MessageList messages={selected.messages}/><Composer disabled={!selected.assigned} onSend={(text) => reply(selected.id, text)} placeholder={selected.assigned ? 'Responder ao cliente…' : 'Assuma a conversa para responder'}/></> : <p>Selecione uma conversa.</p>}</section>
    <aside className="details"><h3>Detalhes da conversa</h3>{selected && <div className="ticket"><b>{selected.name}</b><small>{selected.status}</small><hr/><b>Origem</b><p>Nexo Assist</p><b>Responsável</b><p>{selected.assigned ? 'Você' : 'Não atribuído'}</p><b>Observação</b><p>Dados demonstrativos armazenados neste navegador.</p></div>}</aside></main>;
}
