import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useLang, type Strings } from '../context/LangContext'

const MODULES: {
  id: string; icon: string; status: string; url?: string; passToken?: boolean
  labelKey: keyof Strings; descKey: keyof Strings
}[] = [
  {
    id: 'ventas', icon: '💰', status: 'active',
    url: 'https://eventos-ventas-frontend.vercel.app', passToken: true,
    labelKey: 'moduleVentas', descKey: 'moduleVentasDesc',
  },
  {
    id: 'eventos', icon: '📋', status: 'active',
    url: 'https://eventos-eventos-frontend.vercel.app', passToken: true,
    labelKey: 'moduleEventos', descKey: 'moduleEventosDesc',
  },
  {
    id: 'layouts', icon: '🗺️', status: 'active',
    url: 'https://rn-layout-engine.vercel.app',
    labelKey: 'moduleLayouts', descKey: 'moduleLayoutsDesc',
  },
  {
    id: 'inventory', icon: '📦', status: 'active',
    url: 'https://eventos-inventarios.vercel.app', passToken: true,
    labelKey: 'moduleInventario', descKey: 'moduleInventarioDesc',
  },
  {
    id: 'fieldops', icon: '📱', status: 'active',
    url: 'https://eventos-fieldops-frontend.vercel.app', passToken: true,
    labelKey: 'moduleFieldOps', descKey: 'moduleFieldOpsDesc',
  },
  {
    id: 'financiero', icon: '💵', status: 'soon',
    labelKey: 'moduleFinanciero', descKey: 'moduleFinancieroDesc',
  },
  {
    id: 'administrativo', icon: '⚙️', status: 'soon',
    labelKey: 'moduleAdministrativo', descKey: 'moduleAdministrativoDesc',
  },
  {
    id: 'agentes-ai', icon: '🤖', status: 'soon',
    labelKey: 'moduleAgentesAI', descKey: 'moduleAgentesAIDesc',
  },
]

async function goToModule(mod: (typeof MODULES)[number]) {
  if (!mod.url) return
  if (mod.passToken) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      window.location.href = `${mod.url}/callback#access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer`
      return
    }
  }
  window.location.href = mod.url
}

export default function Dashboard() {
  const { lang, setLang, t } = useLang()
  const [user, setUser] = useState<User | null>(null)
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
        <p style={{ color: '#fff', fontSize: 16 }}>{t.loading}</p>
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
          <p style={styles.navLabel}>{t.navLabel}</p>
          {MODULES.map(mod => (
            <button
              key={mod.id}
              onClick={() => goToModule(mod)}
              disabled={mod.status === 'soon'}
              style={{
                ...styles.navItem,
                ...(mod.status === 'soon' ? styles.navItemDisabled : {}),
              }}
            >
              <span style={styles.navIcon}>{mod.icon}</span>
              <span style={styles.navText}>{t[mod.labelKey]}</span>
              {mod.status === 'soon' && (
                <span style={styles.navBadge}>{t.comingSoon}</span>
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
          <button onClick={handleLogout} style={styles.logoutBtn} title={t.logout}>
            ↩
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={styles.main}>
        <header style={styles.topbar}>
          <div>
            <h1 style={styles.pageTitle}>{t.pageTitleHome}</h1>
          </div>
          <div style={styles.userChip}>
            <button
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              style={styles.langToggle}
              title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              {lang === 'es' ? 'EN' : 'ES'}
            </button>
            {avatar
              ? <img src={avatar} alt="avatar" style={styles.chipAvatar} />
              : <div style={{ ...styles.chipAvatar, ...styles.chipInitials }}>{initials}</div>
            }
            <span style={styles.chipName}>{name.split(' ')[0]}</span>
          </div>
        </header>

        <div style={styles.content}>
          <ModuleGallery t={t} />
        </div>
      </main>

    </div>
  )
}

function ModuleGallery({ t }: { t: Strings }) {
  return (
    <div>
      <h2 style={styles.galleryTitle}>{t.galleryTitle}</h2>
      <p style={styles.gallerySubtitle}>{t.gallerySubtitle}</p>
      <div style={styles.galleryGrid}>
        {MODULES.map(mod => (
          <div
            key={mod.id}
            style={{
              ...styles.moduleCard,
              ...(mod.status === 'soon' ? styles.moduleCardDisabled : {}),
            }}
          >
            <div style={styles.moduleIcon}>{mod.icon}</div>
            <h3 style={styles.moduleName}>{t[mod.labelKey]}</h3>
            <p style={styles.moduleDescription}>{t[mod.descKey]}</p>
            {mod.status === 'soon'
              ? <span style={styles.moduleSoonBadge}>{t.comingSoon}</span>
              : (
                <button style={styles.moduleButton} onClick={() => goToModule(mod)}>
                  {t.enterModule} →
                </button>
              )}
          </div>
        ))}
      </div>
    </div>
  )
}

const SIDEBAR_W = 240

// Paleta extraída de la landing de Reality Near
// (https://events-operating-system.github.io/events-landing/assets/css/style.css)
const COLORS = {
  azul: '#1D4ED8',
  azulOscuro: '#1E3A8A',
  negro: '#0A0F1E',
  blanco: '#FFFFFF',
  grisClaro: '#F8FAFE',
  grisTexto: '#6B7280',
  azulClaro: '#EFF6FF',
  azulBorde: '#BFDBFE',
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: 'flex',
    height: '100vh',
    background: COLORS.grisClaro,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // Sidebar
  sidebar: {
    width: SIDEBAR_W,
    minWidth: SIDEBAR_W,
    background: COLORS.negro,
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
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  sidebarLogo: { fontSize: 24 },
  sidebarTitle: { fontSize: 20, fontWeight: 700, color: COLORS.blanco, letterSpacing: '-0.5px' },

  nav: { flex: 1, padding: '16px 12px', overflowY: 'auto' },
  navLabel: { fontSize: 10, color: COLORS.grisTexto, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 8px 8px', fontWeight: 600 },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    color: '#B0B8C8',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: 2,
    textAlign: 'left',
    transition: 'background 0.15s',
  },
  navIcon: { fontSize: 16, minWidth: 20 },
  navText: { flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  navItemDisabled: { opacity: 0.45, cursor: 'default' },
  navBadge: {
    fontSize: 9, color: COLORS.grisTexto, background: 'rgba(255,255,255,0.06)',
    borderRadius: 4, padding: '2px 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  sidebarFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  avatarSmall: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' },
  avatarInitials: {
    width: 32, height: 32, borderRadius: '50%',
    background: COLORS.azul, color: COLORS.blanco,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  userInfo: { flex: 1, overflow: 'hidden' },
  userName: { fontSize: 13, fontWeight: 600, color: COLORS.blanco, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: 11, color: COLORS.grisTexto, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: {
    background: 'none', border: 'none', color: COLORS.grisTexto,
    fontSize: 18, cursor: 'pointer', padding: '4px',
    borderRadius: 6, flexShrink: 0,
  },

  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 32px',
    background: COLORS.blanco,
    borderBottom: `1px solid ${COLORS.azulBorde}`,
  },
  pageTitle: { fontSize: 26, fontWeight: 700, color: COLORS.negro, margin: 0, letterSpacing: '-0.5px' },
  userChip: { display: 'flex', alignItems: 'center', gap: 8 },
  chipAvatar: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' },
  chipInitials: {
    background: COLORS.azul, color: COLORS.blanco,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700,
  },
  chipName: { fontSize: 14, fontWeight: 600, color: COLORS.negro },
  langToggle: {
    fontSize: 12, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1,
    color: COLORS.azul, background: COLORS.azulClaro, border: `1px solid ${COLORS.azulBorde}`,
    borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
  },

  content: { flex: 1, overflowY: 'auto', padding: 32 },

  // Module gallery (home screen)
  galleryTitle: { fontSize: 22, fontWeight: 700, color: COLORS.negro, margin: '0 0 4px' },
  gallerySubtitle: { fontSize: 16, color: COLORS.grisTexto, margin: '0 0 28px' },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 20,
  },
  moduleCard: {
    background: COLORS.blanco,
    border: `1px solid ${COLORS.azulBorde}`,
    borderRadius: 14,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  moduleIcon: {
    fontSize: 32,
    marginBottom: 14,
    width: 56, height: 56,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: COLORS.azulClaro,
    borderRadius: 12,
  },
  moduleName: { fontSize: 18, fontWeight: 700, color: COLORS.negro, margin: '0 0 6px' },
  moduleDescription: { fontSize: 14, color: COLORS.grisTexto, lineHeight: 1.5, margin: '0 0 20px', flex: 1 },
  moduleButton: {
    padding: '10px 18px', background: COLORS.azul, color: COLORS.blanco,
    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  moduleCardDisabled: { opacity: 0.6 },
  moduleSoonBadge: {
    fontSize: 12, fontWeight: 600, color: COLORS.grisTexto, background: COLORS.grisClaro,
    border: `1px solid ${COLORS.azulBorde}`, borderRadius: 8, padding: '10px 18px',
  },

  loadingScreen: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: COLORS.negro,
  },
}
