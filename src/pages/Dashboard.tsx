import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

const MODULES = [
  { id: 'layouts',   label: 'Layouts',    icon: '🗺️',  status: 'active' },
  { id: 'inventory', label: 'Inventory',  icon: '📦',  status: 'soon' },
  { id: 'crm',       label: 'CRM',        icon: '🤝',  status: 'soon' },
]

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [activeModule, setActiveModule] = useState('layouts')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/'
        return
      }
      setUser(session.user)
      setLoading(false)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <p style={{ color: '#fff', fontSize: 16 }}>Cargando...</p>
      </div>
    )
  }

  const name = user?.user_metadata?.full_name || user?.email || 'Usuario'
  const email = user?.email || ''
  const avatar = user?.user_metadata?.avatar_url || null
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={styles.shell}>

      {/* ── Sidebar ── */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarLogo}>⚡</span>
          <span style={styles.sidebarTitle}>EventOS</span>
        </div>

        <nav style={styles.nav}>
          <p style={styles.navLabel}>Módulos</p>
          {MODULES.map(mod => (
            <button
              key={mod.id}
              onClick={() => mod.status === 'active' && setActiveModule(mod.id)}
              style={{
                ...styles.navItem,
                ...(activeModule === mod.id ? styles.navItemActive : {}),
                ...(mod.status === 'soon' ? styles.navItemDisabled : {}),
              }}
            >
              <span style={styles.navIcon}>{mod.icon}</span>
              <span style={styles.navText}>{mod.label}</span>
              {mod.status === 'soon' && (
                <span style={styles.badge}>Pronto</span>
              )}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div style={styles.sidebarFooter}>
          {avatar
            ? <img src={avatar} alt="avatar" style={styles.avatarSmall} />
            : <div style={styles.avatarInitials}>{initials}</div>
          }
          <div style={styles.userInfo}>
            <p style={styles.userName}>{name.split(' ')[0]}</p>
            <p style={styles.userEmail}>{email}</p>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Cerrar sesión">
            ↩
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={styles.main}>
        <header style={styles.topbar}>
          <div>
            <h1 style={styles.pageTitle}>
              {MODULES.find(m => m.id === activeModule)?.icon}{' '}
              {MODULES.find(m => m.id === activeModule)?.label}
            </h1>
          </div>
          <div style={styles.userChip}>
            {avatar
              ? <img src={avatar} alt="avatar" style={styles.chipAvatar} />
              : <div style={{ ...styles.chipAvatar, ...styles.chipInitials }}>{initials}</div>
            }
            <span style={styles.chipName}>{name.split(' ')[0]}</span>
          </div>
        </header>

        <div style={styles.content}>
          {activeModule === 'layouts' && <LayoutsPlaceholder />}
        </div>
      </main>

    </div>
  )
}

function LayoutsPlaceholder() {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>🗺️</div>
      <h2 style={styles.emptyTitle}>Layouts</h2>
      <p style={styles.emptyText}>
        Aquí verás todos los planos de tus eventos.<br />
        El motor de layouts está en construcción.
      </p>
      <button style={styles.ctaButton}>
        + Crear primer layout
      </button>
    </div>
  )
}

const SIDEBAR_W = 240

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: 'flex',
    height: '100vh',
    background: '#f0f2f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  // Sidebar
  sidebar: {
    width: SIDEBAR_W,
    minWidth: SIDEBAR_W,
    background: '#0f0f0f',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    overflow: 'hidden',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '24px 20px 20px',
    borderBottom: '1px solid #222',
  },
  sidebarLogo: { fontSize: 24 },
  sidebarTitle: { fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' },

  nav: { flex: 1, padding: '16px 12px', overflowY: 'auto' },
  navLabel: { fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 8px 8px', fontWeight: 600 },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    color: '#aaa',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: 2,
    textAlign: 'left',
    transition: 'background 0.15s',
  },
  navItemActive: {
    background: '#1e1e1e',
    color: '#fff',
  },
  navItemDisabled: {
    opacity: 0.4,
    cursor: 'default',
  },
  navIcon: { fontSize: 16, minWidth: 20 },
  navText: { flex: 1 },
  badge: {
    fontSize: 10,
    background: '#2a2a2a',
    color: '#666',
    borderRadius: 4,
    padding: '2px 6px',
    fontWeight: 600,
  },

  sidebarFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px',
    borderTop: '1px solid #1a1a1a',
  },
  avatarSmall: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' },
  avatarInitials: {
    width: 32, height: 32, borderRadius: '50%',
    background: '#333', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  userInfo: { flex: 1, overflow: 'hidden' },
  userName: { fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: 11, color: '#555', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: {
    background: 'none', border: 'none', color: '#555',
    fontSize: 18, cursor: 'pointer', padding: '4px',
    borderRadius: 6, flexShrink: 0,
  },

  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 32px',
    background: '#fff',
    borderBottom: '1px solid #e8e8e8',
  },
  pageTitle: { fontSize: 22, fontWeight: 700, color: '#0f0f0f', margin: 0 },
  userChip: { display: 'flex', alignItems: 'center', gap: 8 },
  chipAvatar: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' },
  chipInitials: {
    background: '#4A90D9', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700,
  },
  chipName: { fontSize: 14, fontWeight: 600, color: '#333' },

  content: { flex: 1, overflowY: 'auto', padding: 32 },

  // Empty state
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', minHeight: 400, textAlign: 'center',
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: 700, color: '#0f0f0f', margin: '0 0 8px' },
  emptyText: { fontSize: 15, color: '#888', lineHeight: 1.6, margin: '0 0 28px' },
  ctaButton: {
    padding: '12px 24px', background: '#0f0f0f', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },

  loadingScreen: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#0f0f0f',
  },
}
