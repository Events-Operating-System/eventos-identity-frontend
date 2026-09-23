import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// Módulos que el ROL del usuario tendría pero el PLAN de la org activa no
// incluye (hoy solo Agentes AI) — get_plan_locked_modules(). Se muestran como
// tile bloqueado con "Disponible desde <plan>" en vez de ocultarse. Un módulo
// que el rol tampoco permite no aparece acá (sigue oculto, como hasta hoy).
//
// module_key -> label del primer plan que lo incluye. Mapa vacío mientras
// resuelve o si el RPC falla: en ese caso el tile simplemente no aparece —
// el acceso lo sigue decidiendo get_user_role_and_modules() (useModuleAccess),
// esto es solo qué explicación se muestra, nunca abre acceso.
export function usePlanLockedModules(activeOrgId: string | null): Map<string, string> {
  // El resultado se guarda junto con la org a la que corresponde: si la org
  // activa cambió, se ignora hasta que llegue el de la nueva (sin resetear
  // estado dentro del efecto).
  const [result, setResult] = useState<{ orgId: string; locked: Map<string, string> } | null>(null)
  // Mismo guard de staleness que useModuleAccess (cambio rápido de org).
  const fetchIdRef = useRef(0)

  useEffect(() => {
    if (!activeOrgId) return
    const fetchId = ++fetchIdRef.current
    supabase
      .rpc('get_plan_locked_modules', { p_org_id: activeOrgId })
      .then(({ data, error }) => {
        if (fetchId !== fetchIdRef.current) return
        const rows = (error ? [] : (data ?? [])) as {
          module_key: string; available_from_plan: string | null; role_allows: boolean
        }[]
        setResult({
          orgId: activeOrgId,
          locked: new Map(
            rows
              .filter((row) => row.role_allows && row.available_from_plan)
              .map((row) => [row.module_key, row.available_from_plan as string]),
          ),
        })
      })
  }, [activeOrgId])

  return result && result.orgId === activeOrgId ? result.locked : EMPTY
}

const EMPTY: Map<string, string> = new Map()
