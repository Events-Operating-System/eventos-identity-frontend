import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// Uso de almacenamiento de la org activa contra su plan (Planes Fase B), desde
// get_org_plan_usage() — misma función que usan los triggers de límite. Se
// consulta al entrar al Dashboard / cambiar de org: el porcentaje es el real
// del momento (80, 85, 92…), no un aviso fijo que aparece una vez.
//
// null mientras resuelve, si falla, o si la org no tiene límite de storage —
// en esos casos no se muestra banner (es solo informativo; el bloqueo real de
// subidas vive en la base).
export type StorageUsage = { used: number; limit: number; pct: number }

export function useStorageUsage(activeOrgId: string | null): StorageUsage | null {
  const [result, setResult] = useState<{ orgId: string; usage: StorageUsage | null } | null>(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    if (!activeOrgId) return
    const fetchId = ++fetchIdRef.current
    supabase.rpc('get_org_plan_usage', { p_org_id: activeOrgId }).then(({ data, error }) => {
      if (fetchId !== fetchIdRef.current) return
      const row = error
        ? null
        : ((data ?? []) as { metric: string; used: number; max_allowed: number | null }[])
            .find((r) => r.metric === 'storage_bytes')
      const usage = row && row.max_allowed
        ? { used: row.used, limit: row.max_allowed, pct: Math.floor((row.used / row.max_allowed) * 100) }
        : null
      setResult({ orgId: activeOrgId, usage })
    })
  }, [activeOrgId])

  return result && result.orgId === activeOrgId ? result.usage : null
}
