# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Manuarte — frontend de una plataforma de gestión y ventas para insumos artesanales (multi-tienda: productos, cotizaciones, facturas, stock, transacciones entre bodegas, flujo financiero/caja). Next.js 14 (App Router) + TypeScript + Tailwind + Ant Design.

## Commands

```bash
npm run dev      # dev server (http://localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint (eslint)
```

There is no automated test suite in this repo.

Env vars live in `.env` (not committed patterns, but this repo has one checked in): `NEXT_PUBLIC_API_URL` (backend base URL), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. Client-exposed vars must be prefixed `NEXT_PUBLIC_`.

## Architecture

### Data flow: libs/api → services/hooks → Redux, mutations centralized in useForm

This is the most important thing to understand before touching data logic:

- **`src/libs/api/*.ts`** — pure axios wrappers per domain (`product.ts`, `billing.ts`, `quote.ts`, etc.), named `<domain>Libs` (e.g. `productLibs`, `billingLibs`). They call `axiosPrivate` from `src/libs/api/axios.ts` and return `res.data` (reads) or the raw `AxiosResponse` (writes). No React, no Redux — these are the only files allowed to make HTTP calls.
- **`src/services/*.ts`** — custom hooks (`use<Domain>Services`) that call `libs/api` functions and `dispatch` results into Redux. This is the "read" path: components call these hooks to fetch and populate store state. Do not call `libs/api` directly from components — go through a service hook or `useForm`.
- **`src/hooks/useForm.tsx`** — a single large hook holding **every** create/update submit handler in the app (`submitCreateProduct`, `submitUpdateBilling`, `submitTransaction`, `submitOpenCashSession`, ...). Each one wraps `libs/api` calls with `handleSubmit`, which shows Ant Design success/error notifications, closes the global modal/drawer on success, and dispatches the Redux update. When adding a new create/update flow, add a new `submit*` function here rather than inlining axios calls in a component.
- **`src/reducers/`** — Redux Toolkit slices, one folder per domain, combined in `src/reducers/store.ts`. Never mutate slice state directly from components; always dispatch actions exported from the slice.
- **`src/stores/`** — Zustand stores for transient UI state (`modalStore.ts`, `drawerStore.ts`). Redux is for domain data, Zustand is for UI-only state.

There is a duplicate axios setup at `src/services/axios.ts` (near-identical to `src/libs/api/axios.ts`, both export `axiosPrivate`) — a leftover from consolidating on the `libs/api` pattern. Treat `src/libs/api/axios.ts` as canonical for new code.

### Global Modal/Drawer system

The app renders one `<CustomModal />` (`src/components/admin/common/layout/Modal`) and one `<CustomDrawer />` (`.../Drawer`) at the layout level. Instead of mounting modal/drawer components per-page, any component opens them via the Zustand stores:

```ts
useModalStore.getState().openModal({ content: ModalContent.products, dataToHandle, componentProps })
useDrawerStore.getState().openDrawer({ content: DrawerContent.quotes, dataToHandle })
```

`content` is a value from `ModalContent`/`DrawerContent` (`src/types/enums.ts`). The hooks `useModal()`/`useDrawer()` (`src/hooks/`) map each enum value to the actual form/content component to render. To add a new modal or drawer variant: add an enum member, register it in the map in `useModal`/`useDrawer`, and (for modals) add its pixel width to the `WIDTH` map in `Modal/index.tsx` if it needs a non-default size.

### Global ambient types — no imports needed

`src/types.d.ts` declares domain interfaces/types (`Product`, `Quote`, `Billing`, `StockItem`, `Transaction`, `SubmitProductDto`, `RootState`, etc.) as global ambient declarations — **do not import them**, they're available everywhere automatically. `RootState` here is the canonical Redux state shape used in `useSelector<RootState>`. Enums used at runtime (not just types) live separately in `src/types/enums.ts` and must be imported normally.

### Auth & route protection

- NextAuth (v5 beta) config is in `src/auth.ts`, using a Credentials provider against the backend (`authServices.login`). The JWT callback decodes the backend's access token (`jwt-decode`) and stores `roleName`, `shop`, `shopId`, `stockId`, `extraPermissions`, etc. on the session.
- `src/middleware.ts` runs on `/admin/:path*` and `/auth/login`. It resolves allowed paths per role from `AUTH_RULES(shop, shopId)` in `src/utils/auth.ts` (roles: `admin`, `cajero`, `bodeguero`), plus an `extraPermissions`-based override map (e.g. `product-read`, `customer-read`) for granting access beyond the base role. Dynamic route matching (`[id]`-style) is done via regex conversion of `ROUTES` entries.
- All routes are centralized in `src/utils/routes.ts` (`ROUTES`) — never hardcode path strings; add new routes there and reference them from `AUTH_RULES` if they need access control.
- `axiosPrivate` request interceptor (`src/libs/api/axios.ts`) attaches the bearer token: server-side calls (config flagged `server: true`) pull the session via `auth()`, client-side calls use `getSession()` from `next-auth/react`.

### API endpoint config

`src/config/env.ts` (`ENV.API.*`) centralizes backend endpoint paths (e.g. `ENV.API.PRODUCTS`, `ENV.API.QUOTES`), combined with `ENV.BASE_URL` (from `NEXT_PUBLIC_API_URL`) in the axios clients. Add new endpoint paths here rather than inlining strings in `libs/api`.

### Routing/domain structure

`src/app/admin/` mirrors the domain areas: `productos`, `staff`, `clientes/[id]`, `cotizaciones/[shopSlug]`, `facturas/[shopSlug]`, `stock/[shopSlug]`, `movimientos-stock`, `flujo-financiero/[shopSlug]`, `dashboard`. Shop-scoped areas (cotizaciones, facturas, stock, flujo-financiero) list shops first, then drill into a `[shopSlug]` route. `src/components/admin/<domain>/` holds the matching domain components; shared building blocks live under `src/components/admin/common/` (`layout/`, `ui/`, `input-data/`, `display-data/`, `PDF/`).

### PDF generation

Quotes/billings can be rendered and sent as PDFs via `@react-pdf/renderer`, under `src/components/admin/common/PDF/` (`PDFDoc`, `PDFPreview`, `PDFContainer`, `PDFActions`) and the `usePdf` hook (`src/hooks/usePdf.tsx`). Sending a generated PDF to a customer goes through `src/libs/api/whatsapp.ts` (`ENV.API.WA_SEND_QUOTE` / `WA_SEND_BILLING`, keyed by `serialNumber`).

## Conventions

- Use tabs for indentation, single quotes, no semicolons required, no trailing commas (see `.prettierrc`).
- Arrow functions for components and functions where possible.
- English for code identifiers (variables, functions, files); Spanish for user-facing UI text.
- Async functions wrap logic in `try/catch` and `console.error` on failure (see `handleSubmit` in `useForm.tsx` for the standard notification + error pattern to reuse for new mutations).
- Strict TypeScript; avoid `any` unless justified.
- Prefer existing components in `src/components/admin/common/` and helpers in `src/utils/` / `src/hooks/` over writing new ones.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).
