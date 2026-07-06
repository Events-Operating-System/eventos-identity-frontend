import Login from './pages/Login'
import Callback from './pages/Callback'
import Dashboard from './pages/Dashboard'
import { LangProvider } from './context/LangContext'

export default function App() {
  const path = window.location.pathname

  return (
    <LangProvider>
      {path === '/callback' ? <Callback />
        : path === '/dashboard' ? <Dashboard />
        : <Login />}
    </LangProvider>
  )
}
