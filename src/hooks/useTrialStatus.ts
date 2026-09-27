import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// Fase D3: prueba en curso de la org activa, para el aviso del Dashboard.
// org_subscriptions solo es visible para owner/admin (RLS): para el resto no
// hay fila y no se muestra nada. Se consulta al entrar / cambiar de org, sin
// nada programado. daysLeft se calcula al llegar la respuesta.
export type TrialStatus = { trialEnd: string; daysLeft: number; hasPaymentMethod: boolean }
// D4: pago fallido dentro del margen de 5 días (mismo valor que
// billing_payment_grace() en la base): la fecha límite para ponerse al día.
export type PastDueStatus = { deadline: string }
const GRACE_MS = 5 * 86_400_000

// Días de calendario (en la zona horaria del navegador) hasta el día de corte:
// 0 = termina hoy, 1 = mañana. Con horas redondeadas hacia arriba, el 26/9 un
// corte el 8/10 a las 23:59 daba "13 días" (visto en el test de D3).
function calendarDaysUntil(end: Date): number {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.max(0, Math.round((startOfDay(end) - startOfDay(new Date())) / 86_400_000))
}

export function useTrialStatus(
  activeOrgId: string | null,
): { trial: TrialStatus | null; pastDue: PastDueStatus | null } {
  const [result, setResult] = useState<{
    orgId: string
    trial: TrialStatus | null
    pastDue: PastDueStatus | null
  } | null>(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    if (!activeOrgId) return
    const fetchId = ++fetchIdRef.current
    supabase
      .from('org_subscriptions')
      .select('status, trial_end, has_payment_method, payment_failed_at')
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
        const pastDue =
          data?.status === 'past_due' && data.payment_failed_at
            ? { deadline: new Date(new Date(data.payment_failed_at).getTime() + GRACE_MS).toISOString() }
            : null
        setResult({ orgId: activeOrgId, trial, pastDue })
      })
  }, [activeOrgId])

  return result && result.orgId === activeOrgId
    ? { trial: result.trial, pastDue: result.pastDue }
    : { trial: null, pastDue: null }
}
