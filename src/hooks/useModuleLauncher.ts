import { useCallback, useEffect, useRef, useState } from 'react'
import { goToModule, type LaunchResult, type ModuleLike } from '../lib/goToModule'

export type LaunchError = { moduleId: string; kind: 'denied' | 'error' | 'timeout' }

// Si el código de entrada no llega en este tiempo se corta el pedido y se
// muestra el aviso con "Reintentar" (respuesta normal: ~1 s).
export const LAUNCH_TIMEOUT_MS = 8000

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
//   - el bloqueo contra un segundo toque es un ref, no el estado: no depende
//     de que React ya haya re-renderizado (dos toques muy seguidos podían
//     pasar los dos con el launchingId viejo y pedir dos códigos);
//   - si el código no llega en LAUNCH_TIMEOUT_MS se corta el pedido y queda
//     el aviso 'timeout' (con "Reintentar"), en vez de "Abriendo…" sin fin.
// Sin organización activa se navega directo, sin código (único caso:
// Administración resuelve el alta), igual que antes.
export function useModuleLauncher(activeOrgId: string | null) {
  const [launchingId, setLaunchingId] = useState<string | null>(null)
  const [launchError, setLaunchError] = useState<LaunchError | null>(null)
  const inFlight = useRef(false)

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (!event.persisted) return
      inFlight.current = false
      setLaunchingId(null)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const launch = useCallback(
    async (mod: ModuleLike) => {
      if (inFlight.current) return
      setLaunchError(null)

      if (!activeOrgId) {
        if (mod.url) window.location.href = mod.url
        return
      }

      inFlight.current = true
      setLaunchingId(mod.id)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), LAUNCH_TIMEOUT_MS)
      let result: LaunchResult
      try {
        result = await goToModule(mod, activeOrgId, controller.signal)
      } catch {
        result = controller.signal.aborted ? 'timeout' : 'error'
      } finally {
        clearTimeout(timer)
      }
      if (result === 'navigating') return
      inFlight.current = false
      setLaunchingId(null)
      setLaunchError({ moduleId: mod.id, kind: result })
    },
    [activeOrgId],
  )

  const dismissError = useCallback(() => setLaunchError(null), [])

  return { launch, launchingId, launchError, dismissError }
}
