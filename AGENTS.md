# Reglas de Desarrollo - Frontend Cordibot

## 1. Rol y Contexto del Proyecto
* **Tecnologías Core:** React 19.2, Next.js 16.3 (App Router), TypeScript 5.9.
* **Propósito del Sistema:** Interfaz de usuario para la plataforma de logística y transporte "Cordibot" / "Corditrans". Incluye torre de control, seguimiento de viajes, programación, gestión de flota, liquidación de tarifas y un portal optimizado para conductores.
* **Conexión con Backend:** El backend corre en NestJS. Las peticiones a `/api/*` se reenvían al backend mediante los *rewrites* de `next.config.ts` hacia `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:4000`).
* **Gestor de Paquetes Exclusivo:** `pnpm`. No uses `npm` ni `yarn`.
  * Desarrollo: `pnpm dev`
  * Compilación: `pnpm build`
  * Inicio en producción: `pnpm start`
  * Linter: `pnpm run lint`

---

## 2. Arquitectura de Componentes (Atomic Design)
Toda la interfaz se organiza bajo la metodología **Atomic Design** en `src/components/`:

```
src/components/
├── atoms/       # Componentes indivisibles: Button, Input, Select, Badge, Card, LiveClock, SlaBadge
├── molecules/   # Combinaciones de átomos: KpiCard, Tabs, VehicleAssignment, Alerts
└── organisms/   # Bloques complejos de interfaz: Modal, Form, Navbar, PaginationTable, TraceabilityDrawer
```

### Reglas de Componentes:
1. **Clasificación Estricta:**
   - Un átomo no debe importar ni depender de moléculas u organismos.
   - Las moléculas componen átomos y manejan interacción básica local.
   - Los organismos combinan moléculas y átomos, y se integran con hooks o estado.
2. **Reutilización:** Usa siempre los átomos existentes (`<Button />`, `<Input />`, `<Modal />`, etc.) antes de crear elementos HTML nativos sin estilos compartidos.

---

## 3. Estructura de Enrutamiento y Páginas (App Router)
El enrutador de Next.js se estructura en `src/app/` por dominios de acceso:
* `src/app/(auth)/`: Pantallas de inicio de sesión (`/login`) y verificación de dos pasos.
* `src/app/(panel)/`: Panel administrativo y torre de control para Admin, Jefe de Flota y Analista:
  - `/dashboard`: Indicadores clave (KPIs), operaciones activas y alertas de flota.
  - `/operations`: Listado, creación, filtro y seguimiento de operaciones logísticas.
  - `/operations/programacion`: Asignación y programación de viajes.
  - `/fleet`: Inventario de vehículos (cabezotes y remolques) y asignaciones de conductores.
  - `/locations`: Directorio de clientes y ubicaciones (puertos, bodegas, patios).
  - `/novedades`: Reporte, categorización y resolución de incidencias en ruta o patio.
  - `/tariff`: Configuración de tarifas por cliente, patios y recargos operativos.
  - `/profiles`: Perfiles 360° de trazabilidad para conductores, vehículos y contenedores.
  - `/user`: Administración de analistas y personal del sistema.
  - `/settings`: Preferencias del sistema.
* `src/app/driver/`: Portal móvil exclusivo para conductores (flujo guiado de viaje, confirmación y evidencias).

### Protección y Redirección de Rutas (`src/proxy.ts`):
* La seguridad y redirección de rutas se gestiona mediante el proxy/middleware en `src/proxy.ts`.
* Evalúa la cookie `corditrans_session` y decodifica el rol del JWT:
  - Conductores solo pueden acceder a `/driver` y `/profiles`.
  - Analistas tienen restringido el acceso a `/fleet`, `/locations` y `/operations/programacion`.
  - Usuarios no autenticados son redirigidos a `/login`.

---

## 4. Gestión del Estado
* **Estado del Servidor (Server State):**
  - Usa exclusivamente `@tanstack/react-query` (v5) para peticiones asíncronas, caché y revalidación.
  - Encapsula las consultas y mutaciones en hooks personalizados dentro de `src/hooks/` (ej. `use-operations.ts`, `use-fleet.ts`).
  - No dupliques datos del servidor dentro del estado local de React o Zustand.
* **Estado Global del Cliente (Client State):**
  - Usa exclusivamente `zustand` (v5) para estados de UI y sesión cliente.
  - Los almacenes se definen en `src/store/`:
    - `use-auth.store.ts`: Usuario autenticado y permisos.
    - `use-auth-driver-store.ts`: Sesión de conductor en el portal móvil.
    - `use-ui.store.ts`: Estados globales de interfaz (sidebar, drawers, modales).
    - `useFleetStore.ts`, `use-driver.store.ts`, `userStore.ts`.

---

## 5. Formularios y Validación de Datos
* **Librerías Obligatorias:** `react-hook-form` + `zod` + `@hookform/resolvers/zod`.
* **Ubicación de Esquemas:** Todo esquema Zod debe residir en `src/schemas/` (ej. `operation.schema.ts`, `client-schema.ts`, `location.schema.ts`, `surcharge.schema.ts`).
* **Inferencia de Tipos:** Exporta siempre los tipos derivados de los esquemas usando `z.infer<typeof schema>`.
* **Control de Errores en Formularios:** Muestra mensajes de validación contextuales debajo de cada campo a través de las propiedades de error de `react-hook-form`.

---

## 6. Consumo de API y Tiempo Real
* **Cliente HTTP (`src/services/api.service.ts`):**
  - Instancia centralizada de `axios` con `baseURL: '/api'`, `withCredentials: true` y timeout de 10 segundos.
  - Las credenciales (`corditrans_session`) se transmiten automáticamente vía cookies HTTP-only.
  - Los interceptores gestionan los errores y notifican mediante `showToast.error()` (omitiendo 401 para permitir redirección).
* **Servicios de API (`src/services/`):**
  - Todo consumo de endpoint debe ubicarse en una función de servicio en `src/services/` (ej. `operation.service.ts`, `tariff.service.ts`).
  - Tipa estrictamente los parámetros y retornos con interfaces de `src/types/`.
* **WebSockets y Tiempo Real (`src/lib/socket.ts`):**
  - Instancia `socket.io-client` conectada a `NEXT_PUBLIC_API_URL` con `transports: ['websocket']`.
  - Se utiliza para sincronizar cambios en vivo: `operation_${id}_updated`, `global_operations_updated`, etc.

---

## 7. Estilos, UI y Notificaciones
* **Sistema de Estilos:**
  - Se utiliza **CSS Modules** (`*.module.css`) junto con variables CSS nativas definidas en `src/app/globals.css` (`--color-brand-900`, `--color-accent`, `--color-border`, etc.).
  - **No uses Tailwind CSS** a menos que sea expresamente solicitado por el usuario.
  - Garantiza un diseño adaptable (responsive) con consideraciones táctiles para móviles (portal de conductores).
* **Iconografía:** Usa exclusivamente `lucide-react` para mantener coherencia visual.
* **Notificaciones y Alertas:**
  - Utiliza `sweetalert2` mediante el wrapper centralizado `src/utils/alerts.ts`:
    - `showToast.success(mensaje)`
    - `showToast.error(error, mensajeAlternativo)`

---

## 8. Convenciones de Código y TypeScript
* **Tipado Estricto:** `"strict": true` en `tsconfig.json`. No uses `any`. Tipa explícitamente props de componentes, retornos de funciones, estados y respuestas HTTP.
* **Nomenclatura:**
  - Archivos y carpetas en `kebab-case` (ej. `pagination-table.tsx`, `use-auth-driver-store.ts`, `api-error.ts`).
  - Componentes React en `PascalCase` dentro de archivos en `kebab-case`.
* **Importaciones:** Usa siempre el alias `@/` configurado para `src/` (ej. `@/components/atoms/button`, `@/services/api.service`). Evita rutas relativas profundas (`../../..`).
* **Despliegue:** El proyecto se compila con `output: 'standalone'` para Docker. No introduzcas dependencias ni código que requiera Node runtime en componentes que se rendericen en el cliente.
