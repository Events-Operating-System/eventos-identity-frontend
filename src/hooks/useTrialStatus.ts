import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// Fase D3: prueba en curso de la org activa, para el aviso del Dashboard.
// org_subscriptions solo es visible para owner/admin (RLS): para el resto no
// hay fila y no se muestra nada. Se consulta al entrar / cambiar de org, sin
// nada programado. daysLeft se calcula al llegar la respuesta.
export type TrialStatus = { trialEnd: string; daysLeft: number; hasPaymentMethod: boolean }

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
                daysLeft: Math.max(0, Math.ceil((new Date(data.trial_end).getTime() - Date.now()) / 86_400_000)),
                hasPaymentMethod: !!data.has_payment_method,
              }
            : null
        setResult({ orgId: activeOrgId, trial })
      })
  }, [activeOrgId])

  return result && result.orgId === activeOrgId ? result.trial : null
}
