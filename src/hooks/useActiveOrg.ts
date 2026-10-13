import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchUsableMemberships, pickActiveOrgId, readStoredOrgId, writeStoredOrgId, type OrgMembership } from '../lib/activeOrg'

export type { OrgMembership }

// Organizaciones activas y aprobadas del usuario, con selección persistida —
// mismo criterio de "usable" y mismo formato de localStorage key que ya
// usan Ventas/Financiero/Portal Cliente. Identity no tenía hasta ahora
// ningún selector de organización explícito (resolveLocale.ts resuelve
// multi-org con su propio criterio de "membresía más antigua", pero solo
// para elegir idioma, nunca se expuso al usuario) — este hook es el primero
// en dar una organización activa elegible, necesaria para emitir el código
// de handoff hacia los módulos con el org_id correcto.
export function useActiveOrg(userId: string | undefined) {
  // Atado al usuario para el que se pidió: sin usuario no hay membresías ni carga.
  const [loaded, setLoaded] = useState<{ userId: string; memberships: OrgMembership[] } | null>(null)
  const [overrideOrgId, setOverrideOrgId] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    fetchUsableMemberships(userId).then((usable) => {
      if (cancelled) return
      setLoaded({ userId, memberships: usable })
    })

    return () => {
      cancelled = true
    }
  }, [userId])

  const ready = !!userId && loaded?.userId === userId
  const memberships = useMemo(() => (ready && loaded ? loaded.memberships : []), [ready, loaded])
  const loading = !!userId && !ready

  const storedOrgId = useMemo(() => (userId ? readStoredOrgId(userId) : null), [userId])
  const manualOrgId = overrideOrgId ?? storedOrgId

  const activeOrgId = useMemo(() => pickActiveOrgId(memberships, manualOrgId), [manualOrgId, memberships])

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
