import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Header } from '../components/Header';
import { useDeskStore } from '../store/useDeskStore';
import { AgentPage } from '../pages/AgentPage';
import { ChatPage } from '../pages/ChatPage';
import { LoginPage } from '../pages/LoginPage';
import { ProfilePage } from '../pages/ProfilePage';
function ProtectedRoute() { const session = useDeskStore((s) => s.session); return session ? <Outlet/> : <Navigate to="/login" replace/>; }
export function App() { const session = useDeskStore((s) => s.session); return <><Header/><Routes><Route path="/login" element={session ? <Navigate to="/atendimento" replace/> : <LoginPage/>}/><Route element={<ProtectedRoute/>}><Route path="/atendimento" element={<ChatPage/>}/><Route path="/perfil" element={<ProfilePage/>}/><Route path="/atendente" element={<AgentPage/>}/></Route><Route path="*" element={<Navigate to={session ? '/atendimento' : '/login'} replace/>}/></Routes></>; }
