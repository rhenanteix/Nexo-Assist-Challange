import { LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDeskStore } from '../store/useDeskStore';
export function Header() {
  const session = useDeskStore((s) => s.session);
  const logout = useDeskStore((s) => s.logout);
  const navigate = useNavigate();
  return <header className="top"><NavLink className="brand" to={session ? '/atendimento' : '/login'}><span className="brandmark">✳</span>Nexo <b>Assist</b></NavLink>
    {session && <><nav aria-label="Navegação principal"><NavLink to="/atendimento">Atendimento</NavLink><NavLink to="/perfil">Meu perfil</NavLink><NavLink to="/atendente">Painel do atendente</NavLink></nav><div className="user"><span className="avatar">AS</span><div><strong>{session.name}</strong><small>{session.email}</small></div><button aria-label="Sair" title="Sair" onClick={() => { logout(); navigate('/login'); }}><LogOut size={18}/></button></div></>}
  </header>;
}
