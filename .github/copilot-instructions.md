# Manuarte Frontend — Copilot Workspace Instructions

Plataforma de gestión y ventas para insumos artesanales. Stack: Next.js, TypeScript, Tailwind CSS, Ant Design, Redux Toolkit y Zustand.

## Stack y Arquitectura

- **Framework:** Next.js (App Router)
- **Lenguaje:** TypeScript
- **UI:** Ant Design + Tailwind CSS
- **Estado global:** Redux Toolkit (`src/reducers/`) y Zustand (`src/stores/`)
- **API Layer:** `src/libs/api/` y `src/services/`

### Estructura relevante

- `src/app/` — Entrypoints, layouts, rutas y páginas
- `src/components/` — Componentes reutilizables por dominio
- `src/libs/api/`, `src/services/` — Acceso a datos y lógica de negocio
- `src/reducers/` — Redux slices
- `src/stores/` — Zustand stores
- `src/hooks/` — Hooks personalizados
- `src/utils/`, `src/config/` — Utilidades y configuración

## Reglas y convenciones clave

- **No llamadas API en componentes:** Usa siempre servicios/libs
- **Estado global:** Redux para datos complejos, Zustand para UI/simple
- **Nombres:** Inglés para código, español para UI
- **Rutas:** Centralizadas en `src/utils/routes.ts`
- **Formularios:** Hooks custom + Ant Design
- **Errores:** `console.error` en desarrollo
- **Variables de entorno:** Prefijo `NEXT_PUBLIC_` para uso en cliente
- **No modificar slices directamente:** Usa actions/dispatch

## Comandos

- **Desarrollo:** `npm run dev` (o `yarn dev`, `pnpm dev`, `bun dev`)
- **Build:** `npm run build`
- **Test:** No hay tests automatizados por defecto

## Gotchas

- No mezclar lógica de negocio en componentes
- No hardcodear rutas ni endpoints
- Usa helpers y constantes existentes
- Middleware y `AUTH_RULES` para proteger rutas admin

## Estilos y paleta de colores

- **Tailwind CSS**: Usa utilidades de Tailwind para la mayoría de los estilos rápidos.
- **Ant Design**: Utiliza componentes de Ant Design para UI compleja y formularios.
- **Paleta**: Los colores principales se definen en `tailwind.config.ts` y pueden extenderse según el diseño. Usa variables CSS (`--background`, `--foreground`) para temas globales.
- **Customización**: Si necesitas sobrescribir estilos de Ant Design, hazlo usando clases utilitarias o el sistema de temas de AntD.

## Reutilización de código

- **Componentes**: Prefiere componentes existentes en `src/components/` antes de crear uno nuevo.
- **Utils y helpers**: Usa funciones de `src/utils/` y `src/hooks/` para lógica repetitiva o transformaciones.
- **Hooks**: Implementa lógica compartida como hooks personalizados en `src/hooks/`.
- **No duplicar lógica**: Si una función/utilidad ya existe, reutilízala o extiéndela.

## Estilo de código

- **Arrow functions**: Usa arrow functions para componentes y funciones siempre que sea posible.
- **Manejo de errores**: Usa `try/catch` en funciones asíncronas y reporta errores con `console.error` en desarrollo.
- **Nombres descriptivos**: Elige nombres claros y en inglés para variables, funciones y archivos.
- **Tipado**: Usa TypeScript estricto y evita `any` salvo casos justificados.
- **Convenciones**: Sigue el formato y convenciones del proyecto para imports, espaciado y organización de archivos.

## Referencias

- [README.md](../README.md)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Ant Design Docs](https://ant.design/components/overview/)

---

> Si agregas nuevas reglas, documenta aquí o enlaza a la fuente.
