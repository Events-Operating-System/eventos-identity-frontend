import { describe, expect, it } from 'vitest'
import { getModulesView, getVisibleModules } from './visibleModules'

const MODULES = [{ id: 'ventas' }, { id: 'administrativo' }, { id: 'financiero' }]

describe('getVisibleModules', () => {
  it('sin organización activa: Administración sigue visible, el resto no (única puerta de alta)', () => {
    expect(getVisibleModules(MODULES, null, null)).toEqual([{ id: 'administrativo' }])
  })

  it('con organización activa pero permisos todavía sin resolver: no muestra nada', () => {
    expect(getVisibleModules(MODULES, null, 'org-123')).toEqual([])
  })

  it('con permisos resueltos: filtra por module_keys del rol', () => {
    expect(getVisibleModules(MODULES, ['ventas', 'financiero'], 'org-123'))
      .toEqual([{ id: 'ventas' }, { id: 'financiero' }])
  })

  it('suma los módulos bloqueados por plan, en el orden del catálogo', () => {
    const catalog = [{ id: 'ventas' }, { id: 'agentes-ai' }, { id: 'financiero' }]
    expect(getVisibleModules(catalog, ['ventas', 'financiero'], 'org-123', ['agentes_ai']))
      .toEqual([{ id: 'ventas' }, { id: 'agentes-ai' }, { id: 'financiero' }])
  })

  it('los bloqueados por plan no aparecen mientras los permisos no resolvieron', () => {
    const catalog = [{ id: 'agentes-ai' }]
    expect(getVisibleModules(catalog, null, 'org-123', ['agentes_ai'])).toEqual([])
  })
})

describe('getModulesView', () => {
  const catalog = [{ id: 'ventas' }, { id: 'administrativo' }, { id: 'agentes-ai' }]
  const base = { modules: catalog, orgs: 'ready' as const, activeOrgId: 'org-123', moduleKeys: ['ventas', 'administrativo'], planLockedKeys: [] as string[] }

  it('regresión 24/10: organizaciones todavía cargando → loading, no "solo Administración"', () => {
    expect(getModulesView({ ...base, orgs: 'loading', activeOrgId: null, moduleKeys: null, planLockedKeys: null }))
      .toEqual({ status: 'loading' })
  })

  it('si falla la consulta de organizaciones → error, no la vista de usuario sin organización', () => {
    expect(getModulesView({ ...base, orgs: 'error', activeOrgId: null, moduleKeys: null, planLockedKeys: null }))
      .toEqual({ status: 'error' })
  })

  it('con org activa y permisos sin resolver → loading', () => {
    expect(getModulesView({ ...base, moduleKeys: null })).toEqual({ status: 'loading' })
  })

  it('con permisos pero bloqueos por plan sin resolver → loading (no suma tiles después)', () => {
    expect(getModulesView({ ...base, planLockedKeys: null })).toEqual({ status: 'loading' })
  })

  it('todo resuelto → ready con la lista completa', () => {
    expect(getModulesView({ ...base, planLockedKeys: ['agentes_ai'] }))
      .toEqual({ status: 'ready', modules: catalog })
  })

  it('usuario de verdad sin organizaciones → ready con solo Administración', () => {
    expect(getModulesView({ ...base, activeOrgId: null, moduleKeys: null, planLockedKeys: null }))
      .toEqual({ status: 'ready', modules: [{ id: 'administrativo' }] })
  })
})
