import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// Fase D3: prueba en curso de la org activa, para el aviso del Dashboard.
// org_subscriptions solo es visible para owner/admin (RLS): para el resto no
// hay fila y no se muestra nada. Se consulta al entrar / cambiar de org, sin
// nada programado. daysLeft se calcula al llegar la respuesta.
export type TrialStatus = { trialEnd: string; daysLeft: number; hasPaymentMethod: boolean }

// Días de calendario (en la zona horaria del navegador) hasta el día de corte:
// 0 = termina hoy, 1 = mañana. Con horas redondeadas hacia arriba, el 26/9 un
// corte el 8/10 a las 23:59 daba "13 días" (visto en el test de D3).
function calendarDaysUntil(end: Date): number {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.max(0, Math.round((startOfDay(end) - startOfDay(new Date())) / 86_400_000))
}

export function useTrialStatus(activeOrgId: string | null): TrialStatus | null {
  const [result, setResult] = useState<{ orgId: string; trial: TrialStatus | null } | null>(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    if (!activeOrgId) return
    const fetchId = ++fetchIdRef.current
    supabase
      .from('org_subscriptions')
      .select('status, trial_end, has_payment_method')
      .eq('org_id', activeOrgId)
      .maybeSingle()
      .then(({ data }) => {
        if (fetchId !== fetchIdRef.current) return
        const trial =
          data?.status === 'trialing' && data.trial_end
            ? {
                trialEnd: data.trial_end as string,
                daysLeft: calendarDaysUntil(new Date(data.trial_end)),
                hasPaymentMethod: !!data.has_payment_method,
              }
            : null
        setResult({ orgId: activeOrgId, trial })
      })
  }, [activeOrgId])

  return result && result.orgId === activeOrgId ? result.trial : null
}
