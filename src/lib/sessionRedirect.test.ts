import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchUsableMemberships = vi.fn()
const requestHandoffCode = vi.fn()
vi.mock('./activeOrg', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./activeOrg')>()),
  fetchUsableMemberships: (...a: unknown[]) => fetchUsableMemberships(...a),
}))
vi.mock('./goToModule', () => ({ requestHandoffCode: (...a: unknown[]) => requestHandoffCode(...a) }))
vi.mock('./supabase', () => ({ supabase: {} }))

import { destinationForSession, handoffCallbackUrl, moduleForRedirect } from './sessionRedirect'

const EVENTOS = 'https://eventos-eventos-frontend.vercel.app'

describe('moduleForRedirect', () => {
  it('reconoce un módulo por su origen, con o sin ruta', () => {
    expect(moduleForRedirect(EVENTOS)?.id).toBe('eventos')
    expect(moduleForRedirect(`${EVENTOS}/eventos/123?tab=inventario`)?.id).toBe('eventos')
    expect(moduleForRedirect('https://eventos-inventarios.vercel.app/')?.id).toBe('inventory')
  })

  it('no acepta destinos fuera del catálogo', () => {
    expect(moduleForRedirect(null)).toBeNull()
    expect(moduleForRedirect('https://evil.example.com')).toBeNull()
    expect(moduleForRedirect(`https://evil.example.com/${EVENTOS}`)).toBeNull()
    expect(moduleForRedirect('https://eventos-eventos-frontend.vercel.app.evil.com')).toBeNull()
    expect(moduleForRedirect('javascript:alert(1)')).toBeNull()
    expect(moduleForRedirect('/dashboard')).toBeNull()
  })
})

describe('handoffCallbackUrl', () => {
  it('arma el /callback del módulo con el código, conservando el query', () => {
    expect(handoffCallbackUrl(EVENTOS, 'abc')).toBe(`${EVENTOS}/callback#code=abc`)
    expect(handoffCallbackUrl(`${EVENTOS}/`, 'abc')).toBe(`${EVENTOS}/callback#code=abc`)
    expect(handoffCallbackUrl('https://rn-layout-engine.vercel.app/?event_id=9', 'abc'))
      .toBe('https://rn-layout-engine.vercel.app/callback?event_id=9#code=abc')
  })
})

describe('destinationForSession', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    fetchUsableMemberships.mockReset().mockResolvedValue([{ orgId: 'org-b', orgName: 'B' }, { orgId: 'org-a', orgName: 'A' }])
    requestHandoffCode.mockReset().mockResolvedValue({ code: 'abc' })
  })

  it('sin redirect, o con uno desconocido: Dashboard, sin pedir código', async () => {
    expect(await destinationForSession('u1', null)).toBe('/dashboard')
    expect(await destinationForSession('u1', 'https://evil.example.com')).toBe('/dashboard')
    expect(requestHandoffCode).not.toHaveBeenCalled()
  })

  it('con redirect a un módulo: entra con código de un solo uso para la org activa', async () => {
    window.localStorage.setItem('eventos_active_org:u1', 'org-b')
    expect(await destinationForSession('u1', EVENTOS)).toBe(`${EVENTOS}/callback#code=abc`)
    expect(requestHandoffCode).toHaveBeenCalledWith('eventos', 'org-b')
  })

  it('sin org elegida: la primera por nombre', async () => {
    await destinationForSession('u1', EVENTOS)
    expect(requestHandoffCode).toHaveBeenCalledWith('eventos', 'org-a')
  })

  it('sin acceso, con error o si algo falla: Dashboard, nunca el módulo sin código', async () => {
    requestHandoffCode.mockResolvedValueOnce('denied')
    expect(await destinationForSession('u1', EVENTOS)).toBe('/dashboard')
    window.sessionStorage.clear()
    requestHandoffCode.mockResolvedValueOnce('error')
    expect(await destinationForSession('u1', EVENTOS)).toBe('/dashboard')
    window.sessionStorage.clear()
    fetchUsableMemberships.mockRejectedValueOnce(new Error('sin red'))
    expect(await destinationForSession('u1', EVENTOS)).toBe('/dashboard')
  })

  it('corta el ida y vuelta: a la tercera entrada automática seguida, Dashboard', async () => {
    expect(await destinationForSession('u1', EVENTOS)).toContain('/callback#code=')
    expect(await destinationForSession('u1', EVENTOS)).toContain('/callback#code=')
    expect(await destinationForSession('u1', EVENTOS)).toBe('/dashboard')
    expect(requestHandoffCode).toHaveBeenCalledTimes(2)
  })
})
