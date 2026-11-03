import { session } from '../api/client';
export function ProfilePage() { const user = session.user; return <main style={{ padding: 40 }}><h1>Meu perfil</h1><p>Nome: {user?.name}</p><p>E-mail: {user?.email}</p><p>Perfil: {user?.role}</p></main>; }
