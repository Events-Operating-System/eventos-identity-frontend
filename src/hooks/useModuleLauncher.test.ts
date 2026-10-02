import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Entrada a módulos desde el Dashboard (2026-10-02): antes un fallo del código
// de entrada se descartaba en silencio — el usuario tocaba "Entrar" y no pasaba
// nada. Ahora el botón vuelve a su estado normal y queda un aviso.

const goToModuleMock = vi.fn()

vi.mock('../lib/goToModule', () => ({
  goToModule: (...args: unknown[]) => goToModuleMock(...args),
}))

import { useModuleLauncher } from './useModuleLauncher'

const ventas = { id: 'ventas', url: 'https://eventos-ventas-frontend.vercel.app' }

describe('useModuleLauncher', () => {
  beforeEach(() => {
    goToModuleMock.mockReset()
    Object.defineProperty(window, 'location', { writable: true, value: { href: '' } })
  })

  it("'error' del código de entrada → el botón vuelve a la normalidad y queda el aviso de error", async () => {
    goToModuleMock.mockResolvedValue('error')
    const { result } = renderHook(() => useModuleLauncher('org-1'))
    await act(() => result.current.launch(ventas))
    expect(result.current.launchingId).toBeNull()
    expect(result.current.launchError).toEqual({ moduleId: 'ventas', kind: 'error' })
    expect(window.location.href).toBe('')
  })

  it("'denied' → aviso de acceso denegado, sin navegar", async () => {
    goToModuleMock.mockResolvedValue('denied')
    const { result } = renderHook(() => useModuleLauncher('org-1'))
    await act(() => result.current.launch(ventas))
    expect(result.current.launchError).toEqual({ moduleId: 'ventas', kind: 'denied' })
    expect(result.current.launchingId).toBeNull()
  })

  it('goToModule lanza una excepción → se trata como error, no queda colgado', async () => {
    goToModuleMock.mockRejectedValue(new Error('Failed to fetch'))
    const { result } = renderHook(() => useModuleLauncher('org-1'))
    await act(() => result.current.launch(ventas))
    expect(result.current.launchingId).toBeNull()
    expect(result.current.launchError).toEqual({ moduleId: 'ventas', kind: 'error' })
  })

  it('mientras se pide el código: "Abriendo…" (launchingId) y un segundo click no dispara otro pedido', async () => {
    let resolve: (v: string) => void = () => {}
    goToModuleMock.mockReturnValue(new Promise((r) => { resolve = r }))
    const { result } = renderHook(() => useModuleLauncher('org-1'))
    let first: Promise<void> = Promise.resolve()
    act(() => { first = result.current.launch(ventas) })
    expect(result.current.launchingId).toBe('ventas')
    await act(() => result.current.launch(ventas))
    expect(goToModuleMock).toHaveBeenCalledTimes(1)
    await act(async () => { resolve('error'); await first })
    expect(result.current.launchingId).toBeNull()
  })

  it('el próximo intento limpia el aviso anterior; si navega, no hay aviso', async () => {
    goToModuleMock.mockResolvedValueOnce('error').mockResolvedValueOnce('navigating')
    const { result } = renderHook(() => useModuleLauncher('org-1'))
    await act(() => result.current.launch(ventas))
    expect(result.current.launchError).not.toBeNull()
    await act(() => result.current.launch(ventas))
    expect(result.current.launchError).toBeNull()
    expect(result.current.launchingId).toBe('ventas')
  })

  it('cerrar el aviso lo quita', async () => {
    goToModuleMock.mockResolvedValue('error')
    const { result } = renderHook(() => useModuleLauncher('org-1'))
    await act(() => result.current.launch(ventas))
    act(() => result.current.dismissError())
    expect(result.current.launchError).toBeNull()
  })

  it('sin organización activa → navega directo (Administración resuelve el alta), sin código', async () => {
    const { result } = renderHook(() => useModuleLauncher(null))
    await act(() => result.current.launch({ id: 'administrativo', url: 'https://eventos-administracion-frontend.vercel.app' }))
    expect(goToModuleMock).not.toHaveBeenCalled()
    expect(window.location.href).toBe('https://eventos-administracion-frontend.vercel.app')
  })
})
