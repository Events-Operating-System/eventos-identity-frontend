import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

// module_key canónico (public.modules.name) para cada módulo del Dashboard —
// verificado carácter por carácter contra la base compartida, no asumido.
// 'cliente' -> 'portal_cliente' es solo para la entrada de STAFF (org
// activa con acceso al módulo); el login standalone de clientes externos
// en ese mismo dominio no pasa por acá.
export const HANDOFF_MODULE_KEY: Record<string, string> = {
  ventas: 'ventas',
  eventos: 'eventos',
  layouts: 'layout',
  inventory: 'inventario',
  fieldops: 'fieldops',
  financiero: 'financiero',
  administrativo: 'administrativo',
  'agentes-ai': 'agentes_ai',
  cliente: 'portal_cliente',
}

export type ModuleLike = { id: string; url?: string }

export type LaunchResult = 'navigating' | 'denied' | 'error'

// Reemplaza pasar access_token/refresh_token crudos (compartían linaje de
// refresh token con Identity y se rompían por la rotación de Supabase) por
// un código de un solo uso emitido por create-module-handoff-code, atado a
// (usuario, org activa, módulo).
//
// Diagnóstico "permisos por rol/organización no se aplican en runtime"
// (2026-09-21): la versión anterior caía a `window.location.href = mod.url`
// (sin sesión) ante CUALQUIER error de create-module-handoff-code,
// incluido el 403 legítimo de "no tenés acceso a ese módulo en esta
// organización". El módulo destino, sin sesión, rebotaba a Identity →
// Google re-autenticaba → el Callback del módulo entraba por la rama SIN
// `code` (la única que no vuelve a chequear get_user_role_and_modules) y
// dejaba pasar. El rechazo terminaba siendo la vía de acceso. Ahora un 403
// específico devuelve 'denied' y NUNCA navega — cualquier otro error
// (red, 5xx, etc.) devuelve 'error' y tampoco navega. El caller decide qué
// mostrar; no hay ningún camino que aterrice en mod.url sin sesión.
export async function goToModule(mod: ModuleLike, activeOrgId: string | null): Promise<LaunchResult> {
  if (!mod.url) return 'error'

  const moduleKey = HANDOFF_MODULE_KEY[mod.id]
  if (!moduleKey || !activeOrgId) return 'error'

  const { data, error } = await supabase.functions.invoke<{ code: string }>(
    'create-module-handoff-code',
    { body: { org_id: activeOrgId, module_key: moduleKey } },
  )

  if (error) {
    const status = error instanceof FunctionsHttpError ? (error.context as Response).status : null
    return status === 403 ? 'denied' : 'error'
  }
  if (!data?.code) return 'error'

  window.location.href = `${mod.url}/callback#code=${data.code}`
  return 'navigating'
}
