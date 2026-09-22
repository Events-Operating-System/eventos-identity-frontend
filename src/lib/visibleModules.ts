import { HANDOFF_MODULE_KEY } from './goToModule'

export type ModuleTile = { id: string }

// Cuando no hay ninguna organización activa (activeOrgId null), moduleKeys
// también es null (useModuleAccess no tiene org_id para resolver
// get_user_role_and_modules) — pero a diferencia del resto del catálogo,
// Administración es la única puerta de entrada para dar de alta la primera
// organización (NoOrganization.tsx en eventos-administracion-frontend).
// Ocultarla junto con el resto dejaba a un usuario nuevo sin ningún tile
// clickeable. El resto sigue oculto: sin org activa no hay org_id que
// resolver contra get_user_role_and_modules().
export function getVisibleModules<T extends ModuleTile>(
  modules: T[],
  moduleKeys: string[] | null,
  activeOrgId: string | null,
): T[] {
  if (moduleKeys === null) {
    return activeOrgId === null
      ? modules.filter((mod) => mod.id === 'administrativo')
      : []
  }
  return modules.filter((mod) => moduleKeys.includes(HANDOFF_MODULE_KEY[mod.id]))
}
