import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export type OrgMembership = { orgId: string; orgName: string }

function storageKey(userId: string): string {
  return `eventos_active_org:${userId}`
}

function readStoredOrgId(userId: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(userId))
  } catch {
    return null
  }
}

function writeStoredOrgId(userId: string, orgId: string): void {
  try {
    window.localStorage.setItem(storageKey(userId), orgId)
  } catch {
    // localStorage puede fallar en modo privado — la selección simplemente
    // no persiste entre sesiones, no es un error fatal.
  }
}

type MembershipRow = { org_id: string; organizations: { id: string; name: string; approval_status: string } | null }

// Organizaciones activas y aprobadas del usuario, con selección persistida —
// mismo criterio de "usable" y mismo formato de localStorage key que ya
// usan Ventas/Financiero/Portal Cliente. Identity no tenía hasta ahora
// ningún selector de organización explícito (resolveLocale.ts resuelve
// multi-org con su propio criterio de "membresía más antigua", pero solo
// para elegir idioma, nunca se expuso al usuario) — este hook es el primero
// en dar una organización activa elegible, necesaria para emitir el código
// de handoff hacia los módulos con el org_id correcto.
export function useActiveOrg(userId: string | undefined) {
  const [memberships, setMemberships] = useState<OrgMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [overrideOrgId, setOverrideOrgId] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setMemberships([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    supabase
      .from('organization_members')
      .select('org_id, organizations(id, name, approval_status)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .returns<MembershipRow[]>()
      .then(({ data }) => {
        if (cancelled) return
        const usable = (data ?? [])
          .map((row) => row.organizations)
          .filter((org): org is { id: string; name: string; approval_status: string } => org?.approval_status === 'active')
          .map((org) => ({ orgId: org.id, orgName: org.name }))
        setMemberships(usable)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const storedOrgId = useMemo(() => (userId ? readStoredOrgId(userId) : null), [userId])
  const manualOrgId = overrideOrgId ?? storedOrgId

  const activeOrgId = useMemo(() => {
    if (memberships.length === 0) return null
    const valid = manualOrgId && memberships.some((m) => m.orgId === manualOrgId) ? manualOrgId : null
    return valid ?? [...memberships].sort((a, b) => a.orgName.localeCompare(b.orgName))[0].orgId
  }, [manualOrgId, memberships])

  // Self-cura la preferencia guardada (primera vez, o si apuntaba a una
  // org que ya no es válida) — solo escribe a localStorage.
  useEffect(() => {
    if (!userId || !activeOrgId || activeOrgId === storedOrgId) return
    writeStoredOrgId(userId, activeOrgId)
  }, [userId, activeOrgId, storedOrgId])

  const setActiveOrgId = useCallback(
    (orgId: string) => {
      if (!userId) return
      setOverrideOrgId(orgId)
      writeStoredOrgId(userId, orgId)
    },
    [userId],
  )

  return { memberships, activeOrgId, setActiveOrgId, loading }
}
