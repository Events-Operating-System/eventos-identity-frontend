import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import i18n from '../i18n/i18n'
import { detectBrowserLocale } from '../i18n/resolveLocale'

// Builds the OAuth callback URL on the *target* app's own origin (each
// EventOS module owns its own /callback landing page — sessions aren't
// shared across these origins via localStorage, so the redirect must land
// directly where the session needs to end up). `/callback` is inserted into
// the pathname rather than string-concatenated onto the full URL, so an
// existing query string (e.g. rn-layout-engine's `?event_id=`) is preserved
// intact instead of being corrupted by a blindly appended suffix.
function buildCallbackUrl(redirectParam: string | null): string {
  if (!redirectParam) return `${window.location.origin}/callback`
  try {
    const target = new URL(redirectParam)
    target.pathname = target.pathname.replace(/\/$/, '') + '/callback'
    return target.toString()
  } catch {
    return `${window.location.origin}/callback`
  }
}

export default function Login() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Pre-auth: todavía no hay user_id/org, así que el único idioma
  // disponible es el detectado del navegador (ver eventos-identity
  // Frente 1 — cascada personal > org > navegador > 'es').
  useEffect(() => {
    i18n.changeLanguage(detectBrowserLocale())
  }, [])

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)

    const redirectParam = new URLSearchParams(window.location.search).get('redirect')
    const callbackUrl = buildCallbackUrl(redirectParam)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // Si no hay error, Supabase redirige a Google automáticamente
  }

  // Vía de login por password, aparte del botón de Google — pensada para
  // cuentas de servicio (p.ej. Bailey, agente AI) creadas con email+password
  // nativo en vez de Google OAuth. No reemplaza ni toca el flujo de Google:
  // el resto del equipo (@realitynear.org vía Google) sigue exactamente
  // igual. signInWithPassword resuelve la sesión sincrónicamente, sin pasar
  // por /callback (esa página solo procesa el hash que devuelve el
  // redirect de OAuth).
  async function handlePasswordLogin(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const redirectParam = new URLSearchParams(window.location.search).get('redirect')
    window.location.replace(redirectParam || '/dashboard')
  }

  return (
    <div style={styles.container} className="eos-auth-container">
      <div style={styles.card} className="eos-auth-card">
        <div style={styles.logo}>⚡</div>
        <h1 style={styles.title}>{t('appTitle')}</h1>
        <p style={styles.subtitle}>{t('loginSubtitle')}</p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            t('redirecting')
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('signInWithGoogle')}
            </>
          )}
        </button>

        {!showPasswordForm ? (
          <button
            type="button"
            onClick={() => { setShowPasswordForm(true); setError(null) }}
            style={styles.linkButton}
          >
            {t('passwordLoginToggle')}
          </button>
        ) : (
          <form onSubmit={handlePasswordLogin} style={styles.passwordForm}>
            <input
              type="email"
              required
              autoComplete="username"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.button, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? t('passwordLoginLoading') : t('passwordLoginSubmit')}
            </button>
          </form>
        )}

        {error && <p style={styles.error}>{error}</p>}

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
  logo: {
    fontSize: 48,
    marginBottom: 16,
  },
  linkButton: {
    marginTop: 16,
    background: 'none',
    border: 'none',
    color: '#4A90D9',
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  passwordForm: {
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  input: {
    padding: '12px 14px',
    borderRadius: 10,
    border: '2px solid #e0e0e0',
    fontSize: 16, // 14px dispara zoom automático en iOS Safari al enfocar
    outline: 'none',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#0f0f0f',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    margin: '0 0 32px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '14px 24px',
    background: '#fff',
    border: '2px solid #e0e0e0',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    color: '#333',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  error: {
    marginTop: 16,
    color: '#e53e3e',
    fontSize: 14,
  },
  footer: {
    marginTop: 32,
    fontSize: 13,
    color: '#999',
  },
}
