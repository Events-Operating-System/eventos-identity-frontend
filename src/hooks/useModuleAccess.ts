import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// Módulos habilitados para el rol del usuario en la org activa — misma
// fuente que consultan los 9 módulos destino en su propio Callback.tsx
// (get_user_role_and_modules). Identity no tenía, hasta el diagnóstico
// "permisos por rol/organización no se aplican en runtime" (2026-09-21),
// ninguna consulta a esta función: ofrecía los 9 tiles a cualquier
// usuario, sin filtrar, y dejaba que cada módulo destino rechazara (mal,
// ver goToModule.ts) al entrar. Este hook filtra la lista ANTES de
// ofrecerla, para que un rol sin acceso a un módulo no vea ni el tile.
//
// null = todavía no se resolvió (sin org activa, o fetch en curso) — el
// caller debe tratarlo como "no mostrar nada todavía", nunca como "mostrar
// todo". [] = resuelto: o bien el rol no tiene ningún módulo habilitado,
// o el RPC falló — fail-closed, ambos casos se ven idénticos desde acá a
// propósito, un error nunca debe traducirse en "mostrar todos los tiles".
export function useModuleAccess(activeOrgId: string | null): string[] | null {
  const [moduleKeys, setModuleKeys] = useState<string[] | null>(null)
  // Guard de staleness: solo la invocación más reciente puede aplicar su
  // resultado. Sin esto, cambiar de org activa rápido (OrgSwitcher) podía
  // dejar aplicado el resultado de una consulta vieja sobre la org
  // anterior.
  const fetchIdRef = useRef(0)

  useEffect(() => {
    if (!activeOrgId) {
      setModuleKeys(null)
      return
    }
    const fetchId = ++fetchIdRef.current
    setModuleKeys(null)
    supabase
      .rpc('get_user_role_and_modules', { p_org_id: activeOrgId })
      .then(({ data, error }) => {
        if (fetchId !== fetchIdRef.current) return
        setModuleKeys(error ? [] : (data?.[0]?.module_keys ?? []))
      })
  }, [activeOrgId])

  return moduleKeys
}
