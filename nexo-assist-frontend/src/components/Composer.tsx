import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
interface Props { onSend: (text: string) => void; disabled?: boolean; placeholder?: string; }
export function Composer({ onSend, disabled, placeholder = 'Escreva sua mensagem…' }: Props) {
  const [value, setValue] = useState('');
  function submit(event: FormEvent) { event.preventDefault(); if (!value.trim() || disabled) return; onSend(value.trim()); setValue(''); }
  return <form className="composer" onSubmit={submit}><input aria-label="Mensagem" value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} disabled={disabled}/><button className="primary" type="submit" disabled={disabled || !value.trim()}>Enviar <Send size={16}/></button></form>;
}
