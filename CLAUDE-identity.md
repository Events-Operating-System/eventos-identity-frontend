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
- Módulo "Portal Cliente" agregado al final de la galería/sidebar como "Próximamente" (activado luego en sesión 2026-07-14, ver abajo)
- Fix bug mobile: sidebar de MÓDULOS ya no queda fijo ocupando ~55% del ancho en viewports angostos. Ahora colapsa a menú hamburguesa (☰) oculto por defecto por debajo de 767px, con overlay + backdrop tap-to-dismiss, replicando el patrón ya validado en `rn-layout-engine` (clases `.eos-sidebar` / `.eos-hamburger-btn` / `.eos-backdrop` en `src/index.css`). Verificado con Playwright en viewport iPhone 14 (390×844): sin overflow horizontal, sin regresión en desktop

**Próximo paso:**
- Extender el catálogo de i18n al resto del dashboard (Login, Callback) si se necesita
- Definir arquitectura de Agentes AI — por ahora es solo visión de roadmap, sin implementación funcional
- Validar el fix de sidebar mobile en un iPhone real (pendiente, solo se probó en headless/devtools)

### Sesión 2026-07-14
**Completado:**
- Módulo "Portal Cliente" activado: status 'soon' → 'active', url `https://eventos-portal-cliente-frontend.vercel.app`, mismo patrón que Ventas/Eventos/Layouts/Inventario/FieldOps
- Se descarta la hipótesis previa de auth especial (magic link): el staff inicia sesión con Google directamente en Portal Cliente, sin passToken ni sesión compartida
- Se removió el comentario de advertencia "NO IMPLEMENTAR" dejado en `Dashboard.tsx` (sesión 07-06), ya resuelto

**Próximo paso:**
- Ninguno pendiente sobre Portal Cliente por ahora

### Sesión 2026-07-15
**Completado:**
- Módulo "Administrativo" activado: status 'soon' → 'active', url `https://eventos-administracion-frontend.vercel.app`, mismo patrón que Portal Cliente (sin passToken)
- Ícono, título y descripción sin cambios

**Próximo paso:**
- Quedan "Próximamente" solo Financiero y Agentes AI

### Sesión 2026-07-27
**Completado:**
- Auditoría de multi-tenancy: confirmado que Identity no expone status de organización ni pertenencia — no hay tabla `organizations`/`organization_members` consultada acá, no hay backend/API propio, solo wrapper de Google OAuth + passToken del JWT crudo a los módulos
- Confirmado que el dato (`organizations.approval_status`: pending/active/rejected/suspended, `organization_members.is_active`) vive en el Supabase compartido, con schema dueño en `eventos-administracion-frontend` (`supabase/migrations/`, `create-organization` Edge Function)
- Confirmado que los 9 módulos NO consumen nada de Identity para esto: cada uno (FieldOps, Ventas, Eventos, Inventario ×2, Layouts, Portal Cliente) implementa su propia query directa a `organization_members.is_active`, sin chequear `approval_status`. Administración y Financiero sí chequean `approval_status` con lógica duplicada entre sí, pero el guard no cubre todas las rutas (ni bloquea uso real)
- Corrección durante esta misma sesión: al hacer `git fetch` antes del push apareció el commit `0814f92` ("Mark CTO", 2026-07-23) que activó Agentes AI (`status: soon → active`, url `eventos-agentes-frontend.vercel.app`, `passToken: true`) — no estaba en el local al momento de auditar. Esto invalida la conclusión de que "Agentes AI no existe todavía": el módulo está deployado y accesible, pero no hay clon local de `eventos-agentes-frontend` para confirmar si tiene o no su propio chequeo de `approval_status`. Queda pendiente auditarlo.
- No se modificó código funcional: se decidió no implementar el fix todavía (ver "Próximo paso")

**Próximo paso:**
- Auditar `eventos-agentes-frontend` (clonar/revisar repo) para confirmar si chequea `organization_members`/`approval_status` o deja pasar sin ningún gate, igual que se hizo con los otros 9
- Decidir estrategia para exponer el status de forma centralizada: (a) gate local en Identity antes de entrar a cada módulo, o (b) JWT custom claim vía Supabase Auth Hook (requiere acceso al dashboard/CLI del proyecto Supabase, no linkeado desde ningún repo local)
- Sea cual sea la estrategia, hay que corregir módulo por módulo igual: no hay forma de que un fix en Identity propague solo
