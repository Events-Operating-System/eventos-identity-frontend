// Catálogo de módulos de EventOS: lo usan el Dashboard (tiles) y el login
// (a qué módulo corresponde un `?redirect=`).
export const MODULES: {
  id: string; icon: string; status: string; url?: string
  labelKey: string; descKey: string
}[] = [
  {
    id: 'ventas', icon: '💰', status: 'active',
    url: 'https://eventos-ventas-frontend.vercel.app',
    labelKey: 'moduleVentas', descKey: 'moduleVentasDesc',
  },
  {
    id: 'eventos', icon: '📋', status: 'active',
    url: 'https://eventos-eventos-frontend.vercel.app',
    labelKey: 'moduleEventos', descKey: 'moduleEventosDesc',
  },
  {
    id: 'layouts', icon: '🗺️', status: 'active',
    url: 'https://rn-layout-engine.vercel.app',
    labelKey: 'moduleLayouts', descKey: 'moduleLayoutsDesc',
  },
  {
    id: 'inventory', icon: '📦', status: 'active',
    url: 'https://eventos-inventarios.vercel.app',
    labelKey: 'moduleInventario', descKey: 'moduleInventarioDesc',
  },
  {
    id: 'fieldops', icon: '📱', status: 'active',
    url: 'https://eventos-fieldops-frontend.vercel.app',
    labelKey: 'moduleFieldOps', descKey: 'moduleFieldOpsDesc',
  },
  {
    id: 'financiero', icon: '💵', status: 'active',
    url: 'https://eventos-financiero-frontend.vercel.app',
    labelKey: 'moduleFinanciero', descKey: 'moduleFinancieroDesc',
  },
  {
    id: 'administrativo', icon: '⚙️', status: 'active',
    url: 'https://eventos-administracion-frontend.vercel.app',
    labelKey: 'moduleAdministrativo', descKey: 'moduleAdministrativoDesc',
  },
  {
    id: 'agentes-ai', icon: '🤖', status: 'active',
    url: 'https://eventos-agentes-frontend.vercel.app',
    labelKey: 'moduleAgentesAI', descKey: 'moduleAgentesAIDesc',
  },
  {
    id: 'cliente', icon: '👥', status: 'active',
    url: 'https://eventos-portal-cliente-frontend.vercel.app',
    labelKey: 'moduleCliente', descKey: 'moduleClienteDesc',
  },
]
