import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, session, User } from '../api/client';
export function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('ana@nexo.com.br');
    const [password, setPassword] = useState('demo');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function login(e: FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const result = await api<{
                accessToken: string;
                user: User;
            }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
            session.save(result.accessToken, result.user);
            navigate(result.user.role === 'ANALYST' ? '/atendente' : '/chat');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Falha no login');
        }
        finally {
            setBusy(false);
        }
    }
    return <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 24 }}><form onSubmit={login} style={{ width: '100%', maxWidth: 420, padding: 32, background: 'white', borderRadius: 16, boxShadow: '0 10px 40px #0001' }}><h1>Nexo Assist</h1><p>Service desk inteligente de TI</p><label>E-mail corporativo<input style={{ display: 'block', width: '100%', padding: 12, margin: '8px 0 16px' }} type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label>Senha<input style={{ display: 'block', width: '100%', padding: 12, margin: '8px 0 16px' }} type="password" required value={password} onChange={e => setPassword(e.target.value)}/></label>{error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}<button className="primary" disabled={busy} type="submit">{busy ? 'Entrando…' : 'Entrar'}</button><p style={{ fontSize: 12, marginTop: 16 }}>Demonstração: ana@nexo.com.br ou analista@nexo.com.br · qualquer senha</p></form></main>;
}
