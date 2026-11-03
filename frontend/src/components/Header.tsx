import { Link, useNavigate } from 'react-router-dom';
import { session } from '../api/client';
export function Header() { const navigate = useNavigate(); return <header className="topbar" style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '12px 24px' }}><strong>Nexo Assist</strong><Link to="/chat">Chat</Link>{session.user?.role === 'ANALYST' && <Link to="/atendente">Console</Link>}<Link to="/perfil">Perfil</Link><span style={{ flex: 1 }}/><span>{session.user?.name}</span><button onClick={() => { session.clear(); navigate('/login'); }}>Sair</button></header>; }
