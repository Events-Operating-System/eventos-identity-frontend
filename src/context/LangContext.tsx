import { createContext, useContext, useState, type ReactNode } from 'react'

export type Lang = 'es' | 'en'

const strings = {
  es: {
    navLabel: 'Módulos',
    pageTitleHome: 'Inicio',
    galleryTitle: 'Tus módulos',
    gallerySubtitle: 'Elige un módulo para empezar a trabajar.',
    enterModule: 'Entrar',
    loading: 'Cargando...',
    logout: 'Cerrar sesión',
    moduleVentas: 'Ventas',
    moduleVentasDesc: 'Gestiona clientes, cotizaciones y oportunidades de venta.',
    moduleEventos: 'Eventos',
    moduleEventosDesc: 'Planifica y administra tus eventos de principio a fin.',
    moduleLayouts: 'Layouts',
    moduleLayoutsDesc: 'Diseña y gestiona los planos de tus eventos.',
    moduleInventario: 'Inventario',
    moduleInventarioDesc: 'Controla el inventario de mobiliario y equipos.',
    moduleFieldOps: 'FieldOps',
    moduleFieldOpsDesc: 'Coordina al equipo en sitio durante el evento.',
    moduleFinanciero: 'Financiero',
    moduleFinancieroDesc: 'Gestión financiera, facturación y reportes.',
    moduleAdministrativo: 'Administrativo',
    moduleAdministrativoDesc: 'Configuración y administración general de la cuenta.',
    comingSoon: 'Próximamente',
  },
  en: {
    navLabel: 'Modules',
    pageTitleHome: 'Home',
    galleryTitle: 'Your modules',
    gallerySubtitle: 'Choose a module to get started.',
    enterModule: 'Open',
    loading: 'Loading...',
    logout: 'Log out',
    moduleVentas: 'Sales',
    moduleVentasDesc: 'Manage clients, quotes and sales opportunities.',
    moduleEventos: 'Events',
    moduleEventosDesc: 'Plan and manage your events from start to finish.',
    moduleLayouts: 'Layouts',
    moduleLayoutsDesc: 'Design and manage your event floor plans.',
    moduleInventario: 'Inventory',
    moduleInventarioDesc: 'Track furniture and equipment inventory.',
    moduleFieldOps: 'FieldOps',
    moduleFieldOpsDesc: 'Coordinate the on-site team during the event.',
    moduleFinanciero: 'Finance',
    moduleFinancieroDesc: 'Financial management, billing and reports.',
    moduleAdministrativo: 'Administration',
    moduleAdministrativoDesc: 'General account settings and administration.',
    comingSoon: 'Coming soon',
  },
} as const

export type Strings = { [K in keyof (typeof strings)['es']]: string }

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: Strings
}

const LangContext = createContext<LangContextValue>({
  lang: 'es',
  setLang: () => {},
  t: strings.es,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const stored = (() => {
    try { return localStorage.getItem('eventos-lang') as Lang | null } catch { return null }
  })()
  const [lang, setLangState] = useState<Lang>(stored === 'en' ? 'en' : 'es')

  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('eventos-lang', l) } catch {}
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: strings[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
