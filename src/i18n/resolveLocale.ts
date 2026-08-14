import { supabase } from '../lib/supabase'

export type AppLocale = 'es' | 'en' | 'pt'

function normalize(raw: string | null | undefined): AppLocale | null {
  const lang = raw?.split('-')[0].toLowerCase()
  return lang === 'es' || lang === 'en' || lang === 'pt' ? lang : null
}

export function detectBrowserLocale(): AppLocale {
  return normalize(navigator.language) ?? 'es'
}

// Cascada: locale personal (organization_members.locale) → locale de la
// organización (organizations.locale) → detección de navegador → 'es'.
// Un usuario pertenece a una sola organización (create-organization la
// rechaza si ya existe una fila en organization_members para ese
// user_id), así que no hay ambigüedad de "cuál org" acá.
export async function resolveMemberLocale(
  userId: string
): Promise<{ locale: AppLocale; orgId: string | null }> {
  const { data: member } = await supabase
    .from('organization_members')
    .select('org_id, locale, organizations(locale)')
    .eq('user_id', userId)
    .maybeSingle<{
      org_id: string
      locale: string | null
      organizations: { locale: string | null } | null
    }>()

  if (!member) return { locale: detectBrowserLocale(), orgId: null }

  const personal = normalize(member.locale)
  if (personal) return { locale: personal, orgId: member.org_id }

  const orgLocale = normalize(member.organizations?.locale)
  return { locale: orgLocale ?? detectBrowserLocale(), orgId: member.org_id }
}
