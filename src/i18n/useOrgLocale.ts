import { useEffect, useState } from 'react'
import i18n from './i18n'
import { supabase } from '../lib/supabase'
import { resolveMemberLocale, type AppLocale } from './resolveLocale'

// Solo lo usa Dashboard.tsx: resuelve el idioma del usuario autenticado
// (personal > org > navegador > 'es') y expone setLocale() para el
// toggle, que persiste la elección en organization_members.locale en vez
// de localStorage.
export function useOrgLocale(userId: string | undefined) {
  const [locale, setLocaleState] = useState<AppLocale>('es')

  useEffect(() => {
    if (!userId) return
    resolveMemberLocale(userId).then(({ locale }) => {
      setLocaleState(locale)
      i18n.changeLanguage(locale)
    })
  }, [userId])

  async function setLocale(next: AppLocale) {
    setLocaleState(next)
    i18n.changeLanguage(next)
    if (userId) {
      await supabase
        .from('organization_members')
        .update({ locale: next })
        .eq('user_id', userId)
        .eq('is_active', true)
    }
  }

  return { locale, setLocale }
}
