import { useDeskStore } from '../store/useDeskStore';
export function ProfilePage() {
  const session = useDeskStore((s) => s.session);
  return <main className="profile"><div className="eyebrow">Service desk de TI / Meu perfil</div><h1>Meu perfil</h1><p>Seus dados de acesso ao service desk de TI.</p><section className="panel"><label>Nome<div className="read">{session?.name}</div></label><label>E-mail corporativo<div className="read">{session?.email}</div><small>Gerenciado pela TI</small></label><label>Senha<div className="read">••••••••••••</div></label><p>Redefinição de senha disponível após integração com o provedor de identidade.</p></section></main>;
}
