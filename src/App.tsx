import Login from './pages/Login'
import Callback from './pages/Callback'
import Dashboard from './pages/Dashboard'

export default function App() {
  const path = window.location.pathname

  if (path === '/callback') return <Callback />
  if (path === '/dashboard') return <Dashboard />
  return <Login />
}
