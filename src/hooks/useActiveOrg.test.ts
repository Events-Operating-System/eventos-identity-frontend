import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useActiveOrg } from './useActiveOrg'

// Regresión 24/10: un error al leer las membresías se tomaba como "no tiene
// organizaciones" y el Dashboard quedaba con solo Administración.

const fetchUsableMemberships = vi.fn()

vi.mock('../lib/activeOrg', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/activeOrg')>()),
  fetchUsableMemberships: (...a: unknown[]) => fetchUsableMemberships(...a),
}))

vi.mock('../lib/supabase', () => ({ supabase: {} }))

describe('useActiveOrg', () => {
  beforeEach(() => {
    fetchUsableMemberships.mockReset()
    window.localStorage.clear()
  })

  it('mientras carga: status loading y sin org activa', () => {
    fetchUsableMemberships.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useActiveOrg('u1'))
    expect(result.current.status).toBe('loading')
    expect(result.current.activeOrgId).toBeNull()
  })

  it('resuelto: status ready y org activa', async () => {
    fetchUsableMemberships.mockResolvedValue([{ orgId: 'org-jbd', orgName: 'JBD' }])
    const { result } = renderHook(() => useActiveOrg('u1'))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.activeOrgId).toBe('org-jbd')
  })

  it('si la consulta falla: status error, no ready sin organizaciones', async () => {
    fetchUsableMemberships.mockRejectedValue(new Error('JWT expired'))
    const { result } = renderHook(() => useActiveOrg('u1'))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.memberships).toEqual([])
  })
})
