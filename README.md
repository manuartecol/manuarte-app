# Manuarte — Frontend

Frontend for the Manuarte management and sales platform, for candle and soap-making supplies. A multi-shop application to manage products, quotes, invoices, stock, warehouse-to-warehouse transactions, and financial flow/cash sessions.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Ant Design**.

## Requirements

- Node.js 18+
- Access to the Manuarte backend (REST API), running locally or remotely

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   Any variable that needs to be available on the client must be prefixed with `NEXT_PUBLIC_`.

## Commands

```bash
npm run dev      # development server (http://localhost:3000)
npm run build    # production build
npm run start    # runs the production build
npm run lint     # eslint (next lint)
```

There is no automated test suite in this repo.

## Architecture

### Data flow: `libs/api` → `services`/hooks → Redux, mutations in `useForm`

- **`src/libs/api/*.ts`** — pure axios wrappers per domain (`product.ts`, `billing.ts`, `quote.ts`, etc.), named `<domain>Libs`. They call `axiosPrivate` (`src/libs/api/axios.ts`) and are the only files allowed to make HTTP calls.
- **`src/services/*.ts`** — hooks (`use<Domain>Services`) that call `libs/api` and dispatch the results into Redux. This is the "read" path: components use these hooks to populate the store.
- **`src/hooks/`** — reusable hooks used across the app.
- **`src/reducers/`** — Redux Toolkit slices, one folder per domain, combined in `src/reducers/store.ts`. Never mutate slice state directly from components; always dispatch actions exported from the slice.
- **`src/stores/`** — Zustand stores for transient UI state (`modalStore.ts`, `drawerStore.ts`). Redux is for domain data, Zustand is for UI-only state.

> There is a duplicate axios setup at `src/services/axios.ts` (near-identical to `src/libs/api/axios.ts`), a leftover from consolidating on the `libs/api` pattern. Treat `src/libs/api/axios.ts` as canonical for new code.

### Global Modal/Drawer system

The app renders one `<CustomModal />` and one `<CustomDrawer />` at the layout level. Any component opens them via the Zustand stores:

```ts
useModalStore
	.getState()
	.openModal({ content: ModalContent.products, dataToHandle, componentProps });
useDrawerStore
	.getState()
	.openDrawer({ content: DrawerContent.quotes, dataToHandle });
```

`content` is a value from `ModalContent`/`DrawerContent` (`src/types/enums.ts`). The hooks `useModal()`/`useDrawer()` map each enum value to the actual component to render.

### Global ambient types

`src/types.d.ts` declares domain interfaces/types (`Product`, `Quote`, `Billing`, `StockItem`, `Transaction`, `SubmitProductDto`, `RootState`, etc.) as global ambient declarations — **no import needed**, they're available everywhere in the project. Enums used at runtime live in `src/types/enums.ts` and must be imported normally.

### Auth & route protection

- NextAuth (v5 beta) configured in `src/auth.ts`, using a Credentials provider against the backend (`authServices.login`). The JWT callback decodes the backend's access token (`jwt-decode`) and stores `roleName`, `shop`, `shopId`, `stockId`, `extraPermissions`, etc. on the session.
- `src/middleware.ts` runs on `/admin/:path*` and `/auth/login`, resolving allowed paths per role via `AUTH_RULES(shop, shopId)` in `src/utils/auth.ts` (roles: `admin`, `cajero`, `bodeguero`), plus an `extraPermissions`-based override map.
- Routes are centralized in `src/utils/routes.ts` (`ROUTES`) — never hardcode path strings.

### Endpoint configuration

`src/config/env.ts` (`ENV.API.*`) centralizes backend endpoint paths, combined with `ENV.BASE_URL` (from `NEXT_PUBLIC_API_URL`).

### Routing/domain structure

`src/app/admin/` mirrors the domain areas: `productos`, `staff`, `clientes/[id]`, `cotizaciones/[shopSlug]`, `facturas/[shopSlug]`, `stock/[shopSlug]`, `movimientos-stock`, `flujo-financiero/[shopSlug]`, `dashboard`. Shop-scoped areas list shops first, then drill into a `[shopSlug]` route.

`src/components/admin/<domain>/` holds the matching domain components; shared building blocks live under `src/components/admin/common/` (`layout/`, `ui/`, `input-data/`, `display-data/`, `PDF/`).

### PDF generation

Quotes and invoices are rendered and sent as PDFs via `@react-pdf/renderer`, under `src/components/admin/common/PDF/` and the `usePdf` hook (`src/hooks/usePdf.tsx`). Sending PDFs to customers goes through `src/libs/api/whatsapp.ts`.

## Conventions

- Tabs for indentation, single quotes, no required semicolons, no trailing commas (see `.prettierrc`).
- Arrow functions for components and functions where possible.
- English for code identifiers (variables, functions, files); Spanish for user-facing UI text.
- Async functions wrap logic in `try/catch` with `console.error` on failure.
- Strict TypeScript; avoid `any` unless justified.
- Prefer existing components in `src/components/admin/common/` and helpers in `src/utils/`/`src/hooks/` over writing new ones.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).
