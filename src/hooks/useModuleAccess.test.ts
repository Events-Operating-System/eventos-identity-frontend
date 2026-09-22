import '@testing-library/jest-dom/vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useModuleAccess } from './useModuleAccess'

// Test de regresión: antes de este hook, Dashboard.tsx ofrecía los 9 tiles
// de módulo a cualquier usuario sin consultar get_user_role_and_modules()
// en ningún momento — el filtrado, si existía, dependía de que el módulo
// destino rechazara (y ver goToModule.test.ts para por qué ese rechazo
// terminaba fallando abierto).

const rpcMock = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => rpcMock(...args) },
}))

describe('useModuleAccess', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it('sin org activa: devuelve null y no llama al RPC', () => {
    const { result } = renderHook(() => useModuleAccess(null))

    expect(result.current).toBeNull()
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('con org activa: resuelve al array de module_keys que devuelve el RPC', async () => {
    rpcMock.mockResolvedValue({
      data: [{ role_name: 'sales', module_keys: ['ventas', 'eventos', 'layout'] }],
      error: null,
    })

    const { result } = renderHook(() => useModuleAccess('org-123'))

    expect(result.current).toBeNull() // estado inicial, antes de que resuelva la promesa
    await waitFor(() => {
      expect(result.current).toEqual(['ventas', 'eventos', 'layout'])
    })
    expect(rpcMock).toHaveBeenCalledWith('get_user_role_and_modules', { p_org_id: 'org-123' })
  })

  it('falla cerrado: un error del RPC resuelve a [] (sin acceso a nada), nunca a null indefinido ni a "todos"', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'network error' } })

    const { result } = renderHook(() => useModuleAccess('org-123'))

    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })

  it('guard de staleness: si activeOrgId cambia antes de que resuelva la primera consulta, solo aplica el resultado de la más reciente', async () => {
    let resolveFirst!: (value: { data: { module_keys: string[] }[]; error: null }) => void
    let resolveSecond!: (value: { data: { module_keys: string[] }[]; error: null }) => void

    rpcMock
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolveFirst = resolve }),
      )
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolveSecond = resolve }),
      )

    const { result, rerender } = renderHook(
      ({ orgId }) => useModuleAccess(orgId),
      { initialProps: { orgId: 'org-old' } },
    )

    rerender({ orgId: 'org-new' })

    // La segunda consulta (org-new) resuelve primero...
    resolveSecond({ data: [{ module_keys: ['ventas'] }], error: null })
    await waitFor(() => {
      expect(result.current).toEqual(['ventas'])
    })

    // ...y cuando la primera (org-old, ya obsoleta) resuelve después, no
    // debe pisar el resultado de la consulta más reciente.
    resolveFirst({ data: [{ module_keys: ['financiero', 'administrativo'] }], error: null })
    await new Promise((r) => setTimeout(r, 0))
    expect(result.current).toEqual(['ventas'])
  })
})
