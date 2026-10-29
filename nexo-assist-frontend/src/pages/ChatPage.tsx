import { useState } from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Composer } from '../components/Composer';
import { MessageList } from '../components/MessageList';
import { useDeskStore } from '../store/useDeskStore';
type Phase = 'idle' | 'affected' | 'confirm' | 'tickets' | 'transfer';
export function ChatPage() {
  const messages = useDeskStore((s) => s.messages);
  const tickets = useDeskStore((s) => s.tickets);
  const addMessage = useDeskStore((s) => s.addMessage);
  const createTicket = useDeskStore((s) => s.createTicket);
  const [phase, setPhase] = useState<Phase>('idle');
  const [draft, setDraft] = useState('');
  const [affected, setAffected] = useState('Só eu');
  const navigate = useNavigate();
  function send(text: string) {
    addMessage('user', text);
    if (phase === 'affected') { setAffected(text); setPhase('confirm'); addMessage('bot', 'Confira os dados antes de confirmar o chamado.'); return; }
    if (/analista|humano|transferir|atendente/i.test(text)) { setPhase('transfer'); addMessage('bot', 'Sua solicitação de transferência foi registrada nesta demonstração.'); return; }
    if (/status|consulta|acompanhar|chamado/i.test(text) && !/abrir|novo|criar/i.test(text)) { setPhase('tickets'); addMessage('bot', `Você tem ${tickets.length} chamados registrados. Selecione um para consultar:`); return; }
    setDraft(text); setPhase('affected'); addMessage('bot', 'Entendi. Quem está sendo afetado?');
  }
  function confirm() { const ticket = createTicket({ title: draft.slice(0, 65), description: draft, affected }); addMessage('bot', `Chamado ${ticket.id} criado com prioridade ${ticket.priority.toLowerCase()}.`); setPhase('idle'); setDraft(''); }
  return <main className="chatpage"><div className="chatintro"><div className="eyebrow">Service desk de TI / Atendimento</div><h1>Como podemos ajudar?</h1><span className="online">● Assistente disponível · demonstração local</span></div><MessageList messages={messages}/><section className="chatwidgets" aria-label="Opções de atendimento">
    {phase === 'idle' && <div className="choices"><button onClick={() => send('Quero abrir um novo chamado')}>Abrir novo chamado <ChevronRight size={16}/></button><button onClick={() => send('Consultar status dos chamados')}>Consultar chamados <ChevronRight size={16}/></button><button onClick={() => send('Falar com um analista')}>Falar com analista <ChevronRight size={16}/></button></div>}
    {phase === 'affected' && <div className="choices">{['Só eu', 'Minha equipe', 'Toda a empresa', 'Não sei'].map((item) => <button key={item} onClick={() => send(item)}>{item}</button>)}</div>}
    {phase === 'confirm' && <div className="draft"><div className="drafttop"><b>Novo chamado</b><span className="tag">Aguardando confirmação</span></div><h3>{draft.slice(0, 65)}</h3><p>{draft}</p><div className="draftgrid"><span>Categoria<strong>{/vpn|rede|internet/i.test(draft) ? 'Rede e VPN' : 'Suporte de TI'}</strong></span><span>Prioridade<strong>Alta</strong></span><span>Afetados<strong>{affected}</strong></span></div><div className="actions"><button className="primary" onClick={confirm}><CheckCircle2 size={17}/> Confirmar</button><button className="secondary" onClick={() => setPhase('affected')}>Voltar</button><button className="secondary" onClick={() => { setPhase('idle'); setDraft(''); }}>Cancelar</button></div></div>}
    {phase === 'tickets' && <div className="ticketlist">{tickets.map((ticket) => <button className="ticketoption" key={ticket.id} onClick={() => { addMessage('bot', `${ticket.id}: ${ticket.title}. Status: ${ticket.status}. Prioridade: ${ticket.priority}.`); setPhase('idle'); }}><span><b>{ticket.id}</b> · {ticket.title}<small> · {ticket.status}</small></span><ChevronRight size={18}/></button>)}</div>}
    {phase === 'transfer' && <div className="draft"><b>Transferência solicitada</b><p>Abra o painel do atendente para demonstrar a etapa de atendimento humano.</p><button className="primary" onClick={() => navigate('/atendente')}>Painel do atendente <ChevronRight size={17}/></button></div>}
  </section><Composer onSend={send} placeholder="Escreva para o Nexo…"/><div className="footnote">Protótipo local · sem autenticação ou IA reais</div></main>;
}
