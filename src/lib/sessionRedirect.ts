import { fetchUsableMemberships, pickActiveOrgId, readStoredOrgId } from './activeOrg'
import { requestHandoffCode } from './goToModule'
import { MODULES } from './modules'

// Login con sesión ya abierta: en vez de mostrar el botón de Google, se sigue
// directo al destino. Un `?redirect=` solo se respeta si es de un módulo del
// catálogo (mismo origen); cualquier otra cosa va al Dashboard.

export const DASHBOARD_PATH = '/dashboard'

export function moduleForRedirect(redirect: string | null): { id: string; url: string } | null {
  if (!redirect) return null
  let origin: string
  try {
    origin = new URL(redirect).origin
  } catch {
    return null
  }
  const mod = MODULES.find((m) => m.url && new URL(m.url).origin === origin)
  return mod?.url ? { id: mod.id, url: mod.url } : null
}

// El /callback del módulo, conservando el query del redirect (rn-layout-engine
// llega con ?event_id=) — igual que buildCallbackUrl en Login.tsx.
export function handoffCallbackUrl(redirect: string, code: string): string {
  const target = new URL(redirect)
  target.pathname = target.pathname.replace(/\/$/, '') + '/callback'
  target.hash = `code=${code}`
  return target.toString()
}

// Corta un ida y vuelta sin fin (el módulo rechaza la sesión recién creada y
// vuelve a mandar al login): a la tercera entrada automática en un minuto, se
// deja de insistir.
const LOOP_KEY = 'eos_auto_handoff'
const LOOP_WINDOW_MS = 60_000
const LOOP_MAX = 2

function tooManyAutoHandoffs(now: number): boolean {
  try {
    const recent = (JSON.parse(window.sessionStorage.getItem(LOOP_KEY) ?? '[]') as number[])
      .filter((t) => now - t < LOOP_WINDOW_MS)
    if (recent.length >= LOOP_MAX) return true
    window.sessionStorage.setItem(LOOP_KEY, JSON.stringify([...recent, now]))
  } catch {
    // Sin sessionStorage no hay cómo contar: se sigue.
  }
  return false
}

// A dónde va un usuario con sesión válida. Nunca devuelve un módulo sin código
// de entrada: sin acceso, sin organización o con error, queda en el Dashboard.
export async function destinationForSession(userId: string, redirect: string | null): Promise<string> {
  const mod = moduleForRedirect(redirect)
  if (!mod || !redirect) return DASHBOARD_PATH
  if (tooManyAutoHandoffs(Date.now())) return DASHBOARD_PATH

  try {
    const memberships = await fetchUsableMemberships(userId)
    const activeOrgId = pickActiveOrgId(memberships, readStoredOrgId(userId))
    const result = await requestHandoffCode(mod.id, activeOrgId)
    return typeof result === 'string' ? DASHBOARD_PATH : handoffCallbackUrl(redirect, result.code)
  } catch {
    return DASHBOARD_PATH
  }
}
