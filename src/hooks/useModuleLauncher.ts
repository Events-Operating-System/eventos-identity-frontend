import { useCallback, useEffect, useState } from 'react'
import { goToModule, type LaunchResult, type ModuleLike } from '../lib/goToModule'

export type LaunchError = { moduleId: string; kind: 'denied' | 'error' }

// Entrada a un módulo desde el Dashboard (2026-10-02). Antes launchModule()
// llamaba a goToModule() y descartaba el resultado: si el código de entrada
// fallaba ('error' o 'denied'), el usuario tocaba "Entrar" y no pasaba nada.
// Ahora:
//   - mientras se pide el código, el módulo queda marcado (launchingId): el
//     botón muestra "Abriendo…" y no se puede volver a disparar;
//   - si falla (o goToModule lanza), el botón vuelve a la normalidad y queda
//     launchError para mostrar un aviso ("no se pudo entrar" / "no tenés
//     acceso"), que se limpia en el próximo intento o al cerrarlo;
//   - si navega, queda marcado hasta que la página se va. Si el usuario vuelve
//     con "Atrás" y el navegador restaura la página desde su caché
//     (pageshow con persisted), se desmarca.
// Sin organización activa se navega directo, sin código (único caso:
// Administración resuelve el alta), igual que antes.
export function useModuleLauncher(activeOrgId: string | null) {
  const [launchingId, setLaunchingId] = useState<string | null>(null)
  const [launchError, setLaunchError] = useState<LaunchError | null>(null)

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) setLaunchingId(null)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const launch = useCallback(
    async (mod: ModuleLike) => {
      if (launchingId) return
      setLaunchError(null)

      if (!activeOrgId) {
        if (mod.url) window.location.href = mod.url
        return
      }

      setLaunchingId(mod.id)
      let result: LaunchResult
      try {
        result = await goToModule(mod, activeOrgId)
      } catch {
        result = 'error'
      }
      if (result === 'navigating') return
      setLaunchingId(null)
      setLaunchError({ moduleId: mod.id, kind: result })
    },
    [activeOrgId, launchingId],
  )

  const dismissError = useCallback(() => setLaunchError(null), [])

  return { launch, launchingId, launchError, dismissError }
}
