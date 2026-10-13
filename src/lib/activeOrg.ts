import { supabase } from './supabase'

export type OrgMembership = { orgId: string; orgName: string }

function storageKey(userId: string): string {
  return `eventos_active_org:${userId}`
}

export function readStoredOrgId(userId: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(userId))
  } catch {
    return null
  }
}

export function writeStoredOrgId(userId: string, orgId: string): void {
  try {
    window.localStorage.setItem(storageKey(userId), orgId)
  } catch {
    // localStorage puede fallar en modo privado — la selección simplemente
    // no persiste entre sesiones, no es un error fatal.
  }
}

type MembershipRow = { org_id: string; organizations: { id: string; name: string; approval_status: string } | null }

// Organizaciones activas y aprobadas del usuario.
export async function fetchUsableMemberships(userId: string): Promise<OrgMembership[]> {
  const { data } = await supabase
    .from('organization_members')
    .select('org_id, organizations(id, name, approval_status)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .returns<MembershipRow[]>()
  return (data ?? [])
    .map((row) => row.organizations)
    .filter((org): org is { id: string; name: string; approval_status: string } => org?.approval_status === 'active')
    .map((org) => ({ orgId: org.id, orgName: org.name }))
}

// La elegida si sigue siendo válida; si no, la primera por nombre.
export function pickActiveOrgId(memberships: OrgMembership[], preferredOrgId: string | null): string | null {
  if (memberships.length === 0) return null
  const valid = preferredOrgId && memberships.some((m) => m.orgId === preferredOrgId) ? preferredOrgId : null
  return valid ?? [...memberships].sort((a, b) => a.orgName.localeCompare(b.orgName))[0].orgId
}
