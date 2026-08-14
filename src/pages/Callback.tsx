import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import i18n from '../i18n/i18n'
import { resolveMemberLocale } from '../i18n/resolveLocale'

type UserProfile = {
  email: string
  full_name: string | null
  avatar_url: string | null
}

export default function Callback() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      // Supabase lee el hash de la URL automáticamente y establece la sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setError(sessionError?.message || t('sessionError'))
        setStatus('error')
        return
      }

      const user = session.user
      setProfile({
        email: user.email || '',
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      })

      // Resuelve el idioma (personal > org > navegador > 'es') antes de
      // pasar a 'success', para que esa pantalla ya renderice en el
      // idioma correcto en vez de arrancar en el 'es' inicial de i18next.
      const { locale } = await resolveMemberLocale(user.id)
      i18n.changeLanguage(locale)

      setStatus('success')
      setTimeout(() => {
        const params = new URLSearchParams(window.location.search)
        const redirect = params.get('redirect')
        if (redirect) {
          window.location.replace(redirect)
        } else {
          window.location.replace('/dashboard')
        }
      }, 1500)
    }

    handleCallback()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (status === 'loading') {
    return (
      <div style={styles.container} className="eos-auth-container">
        <div style={styles.card} className="eos-auth-card">
          <div style={styles.spinner}>⟳</div>
          <p style={styles.loadingText}>{t('verifyingSession')}</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={styles.container} className="eos-auth-container">
        <div style={styles.card} className="eos-auth-card">
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2 style={styles.title}>{t('authErrorTitle')}</h2>
          <p style={styles.error}>{error}</p>
          <a href="/" style={styles.link}>{t('backToLogin')}</a>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container} className="eos-auth-container">
      <div style={styles.card} className="eos-auth-card">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={t('avatarAlt')} style={styles.avatar} />
        ) : (
          <div style={styles.avatarPlaceholder}>👤</div>
        )}

        <div style={styles.badge}>{t('authenticatedBadge')}</div>

        <h2 style={styles.title}>
          {profile?.full_name || t('welcomeFallback')}
        </h2>
        <p style={styles.email}>{profile?.email}</p>

        <div style={styles.infoBox}>
          <p style={styles.infoLabel}>{t('googleOAuthLabel')}</p>
          <p style={styles.infoValue}>{t('workingCorrectly')}</p>
        </div>

        <div style={styles.infoBox}>
          <p style={styles.infoLabel}>{t('supabaseSessionLabel')}</p>
          <p style={styles.infoValue}>{t('activeLabel')}</p>
        </div>

        <button onClick={handleLogout} style={styles.logoutButton}>
          {t('logout')}
        </button>

        <p style={styles.footer}>{t('footerTagline')}</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    marginBottom: 16,
    border: '3px solid #e0e0e0',
  },
  avatarPlaceholder: {
    fontSize: 64,
    marginBottom: 16,
  },
  badge: {
    display: 'inline-block',
    background: '#f0fff4',
    color: '#276749',
    border: '1px solid #9ae6b4',
    borderRadius: 20,
    padding: '4px 14px',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0f0f0f',
    margin: '0 0 6px',
  },
  email: {
    fontSize: 15,
    color: '#666',
    margin: '0 0 24px',
  },
  infoBox: {
    background: '#f8f8f8',
    borderRadius: 8,
    padding: '10px 16px',
    marginBottom: 10,
    textAlign: 'left',
  },
  infoLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    margin: '0 0 2px',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 600,
    margin: 0,
  },
  logoutButton: {
    marginTop: 24,
    width: '100%',
    padding: '12px',
    background: '#fff',
    border: '2px solid #e0e0e0',
    borderRadius: 10,
    fontSize: 15,
    color: '#666',
    cursor: 'pointer',
    fontWeight: 600,
  },
  spinner: {
    fontSize: 48,
    animation: 'spin 1s linear infinite',
    display: 'inline-block',
    marginBottom: 16,
  },
  loadingText: {
    color: '#666',
    fontSize: 15,
  },
  error: {
    color: '#e53e3e',
    fontSize: 14,
    marginBottom: 20,
  },
  link: {
    color: '#4A90D9',
    textDecoration: 'none',
    fontSize: 14,
  },
  footer: {
    marginTop: 32,
    fontSize: 13,
    color: '#999',
  },
}
