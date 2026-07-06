# eventos-identity-frontend

## Session Log

### Sesión 2026-06-17
**Completado:**
- Módulo Eventos agregado al dashboard (eventos-eventos-frontend.vercel.app)
- passToken: true igual que Inventory para auth cross-domain

**Próximo paso:**
- Agregar módulo Eventos como opción en el sidebar del dashboard con ícono y descripción correctos

### Sesión 2026-06-19
**Completado:**
- Módulo Ventas agregado al dashboard
- Fix: link "← Volver al dashboard" movido a top-left

**Próximo paso:**
- Ajustar página de detalle del módulo Ventas en dashboard

### Sesión 2026-07-06
**Completado:**
- Sidebar reordenado: Ventas, Eventos, Layouts, Inventario, FieldOps — CRM eliminado, "Inventory" renombrado a "Inventario"
- Paleta de colores real de la landing de Reality Near aplicada al dashboard (azul #1D4ED8, negro #0A0F1E, gris #F8FAFE, etc.), fuente Inter, tipografía más grande
- Nueva pantalla de inicio tipo galería: muestra todos los módulos con ícono, nombre, descripción y botón "Entrar" (segunda forma de navegar, además del sidebar)
- Toggle de idioma ES/EN en el header del dashboard (`src/context/LangContext.tsx`), replicando el patrón de `rn-layout-engine`; default español, persiste en localStorage
- Módulos "Próximamente" agregados (status: 'soon', sin URL): Financiero, Administrativo, Agentes AI — badge "Próximamente" en sidebar y galería en vez de botón activo
- Todo verificado visualmente (Playwright headless) y confirmado en el bundle desplegado en producción

**Próximo paso:**
- Extender el catálogo de i18n al resto del dashboard (Login, Callback) si se necesita
- Definir arquitectura de Agentes AI — por ahora es solo visión de roadmap, sin implementación funcional
