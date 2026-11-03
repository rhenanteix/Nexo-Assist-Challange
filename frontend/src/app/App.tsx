import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { ChatPage } from '../pages/ChatPage';
import { AgentPage } from '../pages/AgentPage';
import { ProfilePage } from '../pages/ProfilePage';
import { session } from '../api/client';
import { Header } from '../components/Header';
function Protected({ children, analyst = false }: {
    children: React.ReactNode;
    analyst?: boolean;
}) {
    if (!session.token)
        return <Navigate to="/login" replace/>;
    if (analyst && session.user?.role !== 'ANALYST')
        return <Navigate to="/chat" replace/>;
    return <>{children}</>;
}
export function App() {
    return <BrowserRouter><Routes>
  <Route path="/login" element={<LoginPage />}/>
  <Route path="/chat" element={<Protected><Header /><ChatPage /></Protected>}/>
  <Route path="/atendente" element={<Protected analyst><Header /><AgentPage /></Protected>}/>
  <Route path="/perfil" element={<Protected><Header /><ProfilePage /></Protected>}/>
  <Route path="*" element={<Navigate to={session.token ? (session.user?.role === 'ANALYST' ? '/atendente' : '/chat') : '/login'} replace/>}/>
    </Routes></BrowserRouter>;
}
