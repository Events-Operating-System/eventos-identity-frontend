import { useState } from 'react'
import type { OrgMembership } from '../hooks/useActiveOrg'

// Solo se renderiza con 2+ organizaciones activas (mismo criterio que el
// OrgSwitcher de Ventas/Financiero/Portal Cliente) — con una sola
// organización, el comportamiento visual no cambia respecto a antes.
export default function OrgSwitcher({
  memberships,
  activeOrgId,
  setActiveOrgId,
}: {
  memberships: OrgMembership[]
  activeOrgId: string | null
  setActiveOrgId: (orgId: string) => void
}) {
  const [open, setOpen] = useState(false)

  if (memberships.length <= 1) return null

  const active = memberships.find((m) => m.orgId === activeOrgId)

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={styles.trigger}
      >
        <span style={styles.triggerLabel}>{active?.orgName ?? ''}</span>
        <span style={{ opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div style={styles.menu}>
          {memberships.map((m) => (
            <button
              key={m.orgId}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setActiveOrgId(m.orgId)
                setOpen(false)
              }}
              style={{
                ...styles.menuItem,
                ...(m.orgId === activeOrgId ? styles.menuItemActive : {}),
              }}
            >
              {m.orgName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid #BFDBFE',
    borderRadius: 8,
    padding: '9px 12px',
    background: '#fff',
    fontSize: 13,
    fontWeight: 600,
    color: '#0A0F1E',
    cursor: 'pointer',
    width: '100%',
  },
  triggerLabel: {
    flex: 1,
    minWidth: 0,
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  menu: {
    position: 'absolute',
    top: '110%',
    left: 0,
    right: 0,
    zIndex: 10,
    background: '#fff',
    border: '1px solid #BFDBFE',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  menuItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '9px 12px',
    fontSize: 13,
    background: 'none',
    border: 'none',
    color: '#374151',
    cursor: 'pointer',
  },
  menuItemActive: {
    color: '#1D4ED8',
    fontWeight: 700,
    background: '#EFF6FF',
  },
}
