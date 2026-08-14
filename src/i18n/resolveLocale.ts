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
//
// Un usuario puede tener legítimamente más de una fila activa en
// organization_members (ver eventos-administracion-frontend@c4b58da:
// alguien ayudando a revisar una org nueva sin dejar la real) — por eso
// NO se usa .maybeSingle() (con 2+ filas devuelve PGRST116, tratado como
// "sin org", el mismo bug ya encontrado y corregido en ese otro repo).
// Identity no tiene selector de "organización activa" (fuera de alcance
// acá), así que ante multi-org se toma la membresía activa más antigua
// (joined_at) de forma determinística.
export async function resolveMemberLocale(
  userId: string
): Promise<{ locale: AppLocale; orgId: string | null }> {
  const { data: members } = await supabase
    .from('organization_members')
    .select('org_id, locale, organizations(locale)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })
    .limit(1)
    .returns<{
      org_id: string
      locale: string | null
      organizations: { locale: string | null } | null
    }[]>()

  const member = members?.[0]
  if (!member) return { locale: detectBrowserLocale(), orgId: null }

  const personal = normalize(member.locale)
  if (personal) return { locale: personal, orgId: member.org_id }

  const orgLocale = normalize(member.organizations?.locale)
  return { locale: orgLocale ?? detectBrowserLocale(), orgId: member.org_id }
}
