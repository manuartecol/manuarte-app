# Manuarte — Frontend

Frontend de la plataforma de gestión y ventas de Manuarte, insumos para velas y jabones. Aplicación multi-tienda para administrar productos, cotizaciones, facturas, stock, transacciones entre bodegas y flujo financiero/caja.

Construido con **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** y **Ant Design**.

## Requisitos

- Node.js 18+
- Acceso al backend de Manuarte (API REST) corriendo localmente o remoto

## Configuración

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env` y completar los valores:

   ```bash
   cp .env.example .env
   ```

   Cualquier variable que deba estar disponible en el cliente debe tener el prefijo `NEXT_PUBLIC_`.

## Comandos

```bash
npm run dev      # servidor de desarrollo (http://localhost:3000)
npm run build    # build de producción
npm run start    # ejecuta el build de producción
npm run lint     # eslint (next lint)
```

## Arquitectura

### Flujo de datos: `libs/api` → `services`/hooks → Redux, mutaciones en `useForm`

- **`src/libs/api/*.ts`** — wrappers de axios puros por dominio (`product.ts`, `billing.ts`, `quote.ts`, etc.), nombrados `<domain>Libs`. Llaman a `axiosPrivate` (`src/libs/api/axios.ts`) y son los únicos archivos autorizados a hacer llamadas HTTP.
- **`src/services/*.ts`** — hooks (`use<Domain>Services`) que llaman a `libs/api` y despachan los resultados a Redux. Es el camino de "lectura": los componentes usan estos hooks para poblar el store.
- **`src/hooks/useForm.tsx`** — un único hook grande con todos los handlers de creación/actualización de la app (`submitCreateProduct`, `submitUpdateBilling`, `submitTransaction`, `submitOpenCashSession`, ...). Cada uno envuelve llamadas a `libs/api` con `handleSubmit`, que muestra notificaciones de Ant Design, cierra el modal/drawer global en éxito y despacha la actualización a Redux.
- **`src/reducers/`** — slices de Redux Toolkit, una carpeta por dominio, combinados en `src/reducers/store.ts`.
- **`src/stores/`** — stores de Zustand para estado de UI transitorio (`modalStore.ts`, `drawerStore.ts`). Redux es para datos de dominio, Zustand para estado exclusivo de UI.

> Existe un setup de axios duplicado en `src/services/axios.ts` (similar a `src/libs/api/axios.ts`), remanente de una consolidación anterior. `src/libs/api/axios.ts` es el canónico para código nuevo.

### Sistema global de Modal/Drawer

La app renderiza un único `<CustomModal />` y `<CustomDrawer />` a nivel de layout. Cualquier componente los abre a través de los stores de Zustand:

```ts
useModalStore
	.getState()
	.openModal({ content: ModalContent.products, dataToHandle, componentProps });
useDrawerStore
	.getState()
	.openDrawer({ content: DrawerContent.quotes, dataToHandle });
```

`content` es un valor de `ModalContent`/`DrawerContent` (`src/types/enums.ts`). Los hooks `useModal()`/`useDrawer()` mapean cada valor del enum al componente a renderizar.

### Tipos globales ambientales

`src/types.d.ts` declara interfaces/tipos de dominio (`Product`, `Quote`, `Billing`, `StockItem`, `Transaction`, `SubmitProductDto`, `RootState`, etc.) como declaraciones ambientales globales — **no requieren import**, están disponibles en todo el proyecto. Los enums usados en runtime viven en `src/types/enums.ts` y sí deben importarse normalmente.

### Auth y protección de rutas

- NextAuth (v5 beta) configurado en `src/auth.ts`, con un Credentials provider contra el backend (`authServices.login`). El callback JWT decodifica el access token del backend (`jwt-decode`) y guarda `roleName`, `shop`, `shopId`, `stockId`, `extraPermissions`, etc. en la sesión.
- `src/middleware.ts` corre sobre `/admin/:path*` y `/auth/login`, resolviendo rutas permitidas por rol vía `AUTH_RULES(shop, shopId)` en `src/utils/auth.ts` (roles: `admin`, `cajero`, `bodeguero`), más un mapa de overrides basado en `extraPermissions`.
- Las rutas están centralizadas en `src/utils/routes.ts` (`ROUTES`) — nunca hardcodear strings de rutas.

### Configuración de endpoints

`src/config/env.ts` (`ENV.API.*`) centraliza los paths de endpoints del backend, combinados con `ENV.BASE_URL` (desde `NEXT_PUBLIC_API_URL`).

### Estructura de rutas/dominio

`src/app/admin/` refleja las áreas de dominio: `productos`, `staff`, `clientes/[id]`, `cotizaciones/[shopSlug]`, `facturas/[shopSlug]`, `stock/[shopSlug]`, `movimientos-stock`, `flujo-financiero/[shopSlug]`, `dashboard`. Las áreas por tienda listan tiendas primero y luego navegan a una ruta `[shopSlug]`.

`src/components/admin/<domain>/` contiene los componentes de cada dominio; los building blocks compartidos viven en `src/components/admin/common/` (`layout/`, `ui/`, `input-data/`, `display-data/`, `PDF/`).

### Generación de PDF

Cotizaciones y facturas se renderizan y envían como PDF vía `@react-pdf/renderer`, bajo `src/components/admin/common/PDF/` y el hook `usePdf` (`src/hooks/usePdf.tsx`). El envío de PDFs a clientes usa `src/libs/api/whatsapp.ts`.

## Convenciones

- Tabs para indentación, comillas simples, sin punto y coma obligatorio, sin comas finales (ver `.prettierrc`).
- Arrow functions para componentes y funciones donde sea posible.
- Identificadores de código en inglés (variables, funciones, archivos); texto de UI en español.
- Funciones async envuelven la lógica en `try/catch` con `console.error` en caso de fallo.
- TypeScript estricto; evitar `any` salvo justificación.
- Preferir componentes existentes en `src/components/admin/common/` y helpers en `src/utils/`/`src/hooks/` antes de crear nuevos.
- Alias de path `@/*` mapea a `src/*` (ver `tsconfig.json`).
