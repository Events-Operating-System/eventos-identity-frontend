import { useEffect, useState } from 'react'
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
  // El resultado queda atado a la org para la que se pidió: al cambiar de org
  // activa (OrgSwitcher) el de la anterior deja de valer en ese mismo render,
  // y una respuesta vieja que llegue tarde no se aplica a la org nueva.
  const [result, setResult] = useState<{ orgId: string; keys: string[] } | null>(null)

  useEffect(() => {
    if (!activeOrgId) return
    let cancelled = false
    supabase
      .rpc('get_user_role_and_modules', { p_org_id: activeOrgId })
      .then(({ data, error }) => {
        if (cancelled) return
        setResult({ orgId: activeOrgId, keys: error ? [] : (data?.[0]?.module_keys ?? []) })
      })
    return () => { cancelled = true }
  }, [activeOrgId])

  return activeOrgId && result?.orgId === activeOrgId ? result.keys : null
}
