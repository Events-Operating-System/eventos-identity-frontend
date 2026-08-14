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

### Sesión 2026-08-13
**Completado:**
- Reemplazado el toggle ES/EN casero (`src/context/LangContext.tsx`, Context propio + `localStorage`) por `react-i18next`, con 3er idioma (PT). Módulo piloto: este patrón se replica después al resto de las 9 apps
- Resolución de idioma en cascada: `organization_members.locale` (personal) → `organizations.locale` (default de la org) → detección de navegador → `es`. Auto-detección trata ES/EN/PT por igual, nunca pisa una preferencia ya guardada
- Nueva migración `organization_members.locale` (nullable, `text`, check `es|en|pt`) en `eventos-administracion-frontend` (repo dueño del schema, no en Identity) — aplicada contra la base compartida con `supabase db query --linked` en vez de `db push`, porque `db push` está bloqueado por un desfasaje preexistente: 8 migraciones remotas sin archivo local en ese repo (`20260727190000`, `20260727203104`, `20260727210552`, `20260727211613`, `20260802195351`, `20260808042603`, `20260808051500`, `20260809222500`). No se investigó ni se tocó — queda pendiente
- Toggle pasa de 2 opciones (ES/EN) a 3 (segmented control ES/EN/PT) en `Dashboard.tsx`, escribe a `organization_members.locale` vía Supabase, no a `localStorage`
- Cobertura completa sin excepciones: `Login.tsx` y `Callback.tsx` (0% cubiertos antes) migrados a `useTranslation()`, incluido el bug de "Sign in with Google" hardcodeado en inglés dentro de una UI en español. En `Dashboard.tsx` se cubrieron los 3 strings sueltos que quedaban fuera del mecanismo (fallback de nombre de usuario, `aria-label` del hamburger, tooltip del toggle)
- **Bug real encontrado y corregido antes de pushear**: la primera versión de `resolveLocale.ts` usaba `.maybeSingle()` sobre `organization_members` filtrado solo por `user_id`. Revisando el historial de `eventos-administracion-frontend` apareció el commit `c4b58da` (2026-08-04): un usuario puede tener legítimamente 2+ filas activas en `organization_members` (ej. alguien ayudando a revisar una org nueva sin dejar la real) — `.maybeSingle()` con 2+ filas devuelve `PGRST116`, el mismo bug ya roto en producción en otro repo (`useOrgStatus` → reemplazado por `OrgContext`). Se corrigió a una query con `.eq('is_active', true).order('joined_at').limit(1)`, sin `.single()`/`.maybeSingle()`. Verificado insertando una segunda organización + membresía de prueba real contra la base compartida, confirmando que no rompe y resuelve determinísticamente a la más antigua; datos de prueba borrados y limpieza confirmada con `select count(*)` en 0
- Pase de responsive en las 3 pantallas: clases nuevas en `src/index.css` (`.eos-auth-container`, `.eos-auth-card`, `.eos-topbar`, `.eos-content`, `.eos-chip-name`), mismo patrón `!important`-sobre-inline ya usado para `.eos-sidebar`. Fix de zoom automático de iOS Safari en inputs de Login (font-size 14px → 16px). Hit-areas táctiles ampliadas en botones del header
- Verificado en vivo contra la base compartida (no solo local): los 3 casos de resolución con datos reales de la cuenta del usuario, el toggle escribiendo a la DB, cero `eventos-lang` en `localStorage`
- Responsive verificado sin scroll horizontal a 768px y 1440px reales, y a 500px (piso real de la herramienta de automatización de browser en este entorno — no se logró bajar a 375px exactos, así que el breakpoint de 480px que se agregó —ocultar nombre de usuario en el header, reducir padding de la card de login— no se pudo verificar visualmente, solo por código)
- `.env.local` creado localmente (gitignored) copiando `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` de `eventos-eventos-frontend` (mismo proyecto Supabase compartido) — seguía sin existir en este repo
- Commits: `eventos-identity-frontend` `c0259d6` (migración a i18next) + `90312b5` (fix multi-org), `eventos-administracion-frontend` `aac409a` (migración SQL). Deploy verificado con evidencia real: estado del commit en Vercel vía `gh api` (`state: success`) y contenido del bundle de producción (`curl` confirmando strings en portugués y el código del fix `is_active`/`joined_at` realmente desplegados, no una versión cacheada)

**Próximo paso:**
- Investigar las 8 migraciones remotas sin archivo local en `eventos-administracion-frontend` (ver arriba) — no se sabe si son ruido (aplicadas desde el dashboard/otra máquina) o schema real desconocido
- Cuando se replique este patrón de i18n al resto de los módulos, reusar el mismo mecanismo de resolución (`organization_members.locale` → `organizations.locale` → navegador) en vez de reinventarlo por app
- Verificar el breakpoint de 480px (`.eos-chip-name`, `.eos-auth-card` compacto) en un teléfono real o el device toolbar de Chrome DevTools — no se pudo emular un viewport tan angosto con la herramienta de automatización disponible en este entorno
