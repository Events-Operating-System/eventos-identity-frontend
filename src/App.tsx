import Login from './pages/Login'
import Callback from './pages/Callback'
import Dashboard from './pages/Dashboard'

export default function App() {
  const path = window.location.pathname

  return path === '/callback' ? <Callback />
    : path === '/dashboard' ? <Dashboard />
    : <Login />
}
