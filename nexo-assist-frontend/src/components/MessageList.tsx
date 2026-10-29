import type { Message } from '../domain/models';
import { timeLabel } from '../shared/format';
interface Props { messages: Message[]; }
export function MessageList({ messages }: Props) {
  return <div className="messages" role="log" aria-live="polite">{messages.map((message) => <article key={message.id} className={`message ${message.sender}`}><span className="sender">{message.sender === 'user' ? 'Você' : message.sender === 'agent' ? 'Analista' : 'Nexo Assist'}</span><div>{message.text}</div><small>{timeLabel(message.createdAt)}</small></article>)}</div>;
}
