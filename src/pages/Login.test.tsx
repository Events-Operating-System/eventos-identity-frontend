import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const getUser = vi.fn()
const signOut = vi.fn()
vi.mock('../lib/supabase', () => ({
  supabase: { auth: {
    getSession: () => getSession(), getUser: () => getUser(), signOut: (...a: unknown[]) => signOut(...a),
    signInWithOAuth: vi.fn(), signInWithPassword: vi.fn(),
  } },
}))
const destinationForSession = vi.fn()
vi.mock('../lib/sessionRedirect', () => ({ destinationForSession: (...a: unknown[]) => destinationForSession(...a) }))

import Login from './Login'

const EVENTOS = 'https://eventos-eventos-frontend.vercel.app'
const replace = vi.fn()

describe('Login: con sesión ya abierta no se pide login de nuevo', () => {
  beforeEach(() => {
    replace.mockReset()
    signOut.mockReset().mockResolvedValue({ error: null })
    destinationForSession.mockReset().mockResolvedValue(`${EVENTOS}/callback#code=abc`)
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: `?redirect=${encodeURIComponent(EVENTOS)}`, origin: 'https://identity.test', replace },
    })
  })
  afterEach(() => cleanup())

  it('sesión válida: no muestra el botón de Google y va directo al destino', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    render(<Login />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    await waitFor(() => expect(replace).toHaveBeenCalledWith(`${EVENTOS}/callback#code=abc`))
    expect(destinationForSession).toHaveBeenCalledWith('u1', EVENTOS)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('sin sesión: muestra el login y no redirige', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    render(<Login />)
    expect((await screen.findAllByRole('button')).length).toBeGreaterThan(0)
    expect(replace).not.toHaveBeenCalled()
    expect(getUser).not.toHaveBeenCalled()
  })

  it('sesión guardada que el servidor ya no acepta: se borra de este navegador y se muestra el login', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    getUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthApiError', message: 'invalid JWT', status: 401 } })
    render(<Login />)
    expect((await screen.findAllByRole('button')).length).toBeGreaterThan(0)
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(replace).not.toHaveBeenCalled()
  })
})
