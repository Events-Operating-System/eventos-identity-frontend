import { FunctionsHttpError } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { goToModule } from './goToModule'

// Test de regresión de la causa raíz diagnosticada 2026-09-21: la versión
// anterior de goToModule() convertía CUALQUIER error de
// create-module-handoff-code (incluido el 403 legítimo de "no tenés
// acceso a ese módulo en esta organización") en
// `window.location.href = mod.url` sin sesión — el módulo destino
// rebotaba a Google, y el Callback del módulo, sin `code`, nunca volvía a
// chequear permisos. El rechazo terminaba siendo la vía de acceso.

const invokeMock = vi.fn()

vi.mock('./supabase', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}))

describe('goToModule', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    // jsdom no soporta asignar window.location.href de forma nativa sin
    // este workaround — se reemplaza el objeto completo para poder leer
    // qué le escribió (o no) el código bajo test.
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    })
  })

  it('con un 403 (sin acceso al módulo): devuelve "denied" y NUNCA navega sin sesión', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError({ status: 403 } as Response),
    })

    const result = await goToModule(
      { id: 'administrativo', url: 'https://eventos-administracion-frontend.vercel.app' },
      'org-123',
    )

    expect(result).toBe('denied')
    // La aserción central de esta regresión: mod.url nunca se escribe en
    // window.location.href cuando el 403 es la causa.
    expect(window.location.href).toBe('')
  })

  it('con un error que no es 403 (red, 5xx): devuelve "error" y tampoco navega', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: new Error('network error'),
    })

    const result = await goToModule(
      { id: 'administrativo', url: 'https://eventos-administracion-frontend.vercel.app' },
      'org-123',
    )

    expect(result).toBe('error')
    expect(window.location.href).toBe('')
  })

  it('con éxito: navega al callback del módulo con el code y devuelve "navigating"', async () => {
    invokeMock.mockResolvedValue({ data: { code: 'abc123' }, error: null })

    const result = await goToModule(
      { id: 'ventas', url: 'https://eventos-ventas-frontend.vercel.app' },
      'org-123',
    )

    expect(result).toBe('navigating')
    expect(window.location.href).toBe('https://eventos-ventas-frontend.vercel.app/callback#code=abc123')
  })

  it('sin org activa: devuelve "error" sin siquiera llamar a create-module-handoff-code', async () => {
    const result = await goToModule({ id: 'ventas', url: 'https://eventos-ventas-frontend.vercel.app' }, null)

    expect(result).toBe('error')
    expect(invokeMock).not.toHaveBeenCalled()
    expect(window.location.href).toBe('')
  })

  it('mod sin url: devuelve "error" sin llamar a create-module-handoff-code', async () => {
    const result = await goToModule({ id: 'ventas' }, 'org-123')

    expect(result).toBe('error')
    expect(invokeMock).not.toHaveBeenCalled()
  })
})
