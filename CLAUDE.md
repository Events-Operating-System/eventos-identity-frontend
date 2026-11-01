# eventos-identity-frontend

Login y panel de entrada de EventOS: el usuario inicia sesión acá, elige organización y entra a cada módulo con un
código de un solo uso (handoff). Ningún módulo de staff tiene login propio.

> **Reglas comunes de EventOS:** `eventos-reglas/REGLAS.md` (se cargan solas desde `~/Developer/CLAUDE.md`). Acá solo
> lo propio de este repo y su estado actual. Bitácora (qué se hizo en cada sesión): `docs/SESSION_LOG.md` (hasta el
> 2026-10-31 este archivo se llamaba `CLAUDE-identity.md` y tenía todo junto).

## Stack
- React 19 + Vite 8 + TypeScript + Supabase JS v2 (sin Tailwind). i18n ES/EN/PT (`src/i18n`).
- Deploy: Vercel (eventos-identity-frontend.vercel.app), automático al hacer push. Rama principal: `master`.

## Reglas propias del repo
- **Entrar a un módulo siempre con código de un solo uso** (`create-module-handoff-code`, Edge Function de
  Administración, que vuelve a chequear el acceso). Nunca mandar a un módulo sin código ni seguir un `redirect` que no
  esté en el catálogo (`lib/modules.ts`, por origen).
- La ruta exacta dentro del módulo no viaja por Identity: la resuelve cada módulo (`returnPath.ts`).

## Estado actual (2026-10-31)
- Login (Google y password) que valida la sesión guardada contra el servidor y, si sirve, va directo al destino
  (`lib/sessionRedirect.ts`), con corte de ida y vuelta.
- Panel con los módulos visibles según organización, permisos y plan (`lib/visibleModules.ts`), que no se dibuja hasta
  tener todo; "Entrar" con aviso de error y límite de 8 s (`useModuleLauncher`).
- Pendiente (acordado el 2026-10-24, sin hacer al 2026-10-31): bajar la demora de "Entrar" en Administración
  (`Access-Control-Max-Age: 86400` en `supabase/functions/_shared/cors.ts` y consultas en paralelo en
  `create-module-handoff-code`; requiere desplegar esa Edge Function).
