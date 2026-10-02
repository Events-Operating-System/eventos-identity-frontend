import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '../i18n/i18n'
import { LaunchErrorNotice } from './Dashboard'

const t = (key: string, options?: Record<string, string>) => i18n.t(key, options) as string

describe('LaunchErrorNotice', () => {
  afterEach(() => cleanup())

  it('error → "No se pudo entrar a Ventas…", y se puede cerrar', async () => {
    await i18n.changeLanguage('es')
    const onDismiss = vi.fn()
    render(<LaunchErrorNotice t={t} error={{ moduleId: 'ventas', kind: 'error' }} moduleName="Ventas" onDismiss={onDismiss} />)
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo entrar a Ventas. Probá de nuevo en un momento.')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('denied → mensaje de acceso, en EN y PT también', async () => {
    await i18n.changeLanguage('en')
    const { unmount } = render(<LaunchErrorNotice t={t} error={{ moduleId: 'ventas', kind: 'denied' }} moduleName="Sales" onDismiss={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent("You don't have access to Sales in this organization.")
    unmount()
    await i18n.changeLanguage('pt')
    render(<LaunchErrorNotice t={t} error={{ moduleId: 'ventas', kind: 'error' }} moduleName="Vendas" onDismiss={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível abrir Vendas.')
  })
})
