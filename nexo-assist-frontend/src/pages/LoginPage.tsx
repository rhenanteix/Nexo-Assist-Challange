import { useState, type FormEvent } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useDeskStore } from '../store/useDeskStore';
const credentials = z.object({ email: z.string().email('Informe um e-mail válido.'), password: z.string().min(4, 'A senha precisa ter ao menos 4 caracteres.') });
export function LoginPage() {
  const [email, setEmail] = useState('ana.souza@nexo.com.br');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useDeskStore((s) => s.login);
  const navigate = useNavigate();
  function submit(event: FormEvent) { event.preventDefault(); const result = credentials.safeParse({ email, password }); if (!result.success) { setError(result.error.issues[0]?.message ?? 'Dados inválidos'); return; } login(email); navigate('/atendimento'); }
  return <main className="login"><section className="hero"><div className="eyebrow">Nexo Assist · Service desk de TI da Nexo</div><h1>Seu problema de TI,<br/><span>resolvido em uma conversa.</span></h1><p>Descreva o que está acontecendo. O assistente consulta seus chamados, busca na central de ajuda e chama um analista quando necessário.</p><div className="demo"><div className="bubble mine">Meu notebook não conecta na VPN. Erro 809.</div><div className="bubble"><b>Nexo Assist</b><p>Pronto: abri o chamado com prioridade alta.</p><strong>INC-20517</strong><small>Rede e VPN · Alta</small></div></div><div className="stats"><div><b>Chat</b><small>Atendimento em um lugar</small></div><div><b>24/7</b><small>Interface de demonstração</small></div></div></section><section className="loginpanel"><form onSubmit={submit}><h2>Entrar</h2><p>Use seu e-mail corporativo para acessar a demonstração.</p><label>E-mail corporativo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username"/></label><label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Sua senha"/></label>{error && <p className="error" role="alert">{error}</p>}<button className="primary wide" type="submit">Entrar <ChevronRight size={18}/></button><small>Modo demonstração: qualquer e-mail válido e senha de 4+ caracteres. Não use credenciais reais.</small></form></section></main>;
}
