import { describe, expect, it } from 'vitest'
import { getVisibleModules } from './visibleModules'

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
})
