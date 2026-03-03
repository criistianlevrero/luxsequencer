# Arquitectura del Sistema de Renderers (Actual)

Este documento describe el estado vigente del sistema de renderers en `0.6-beta`.

## Resumen

- Controles en modo **declarative-only**.
- Renderers oficiales (`webgl`, `concentric`, `dvd-screensaver`) con workers externos.
- Carga de workers mediante proxy same-origin en desarrollo para evitar `SecurityError` al construir `Worker`.
- Política de carga externa con allowlist hardcodeada y validación estricta de clave canónica.

## 1) Registro y resolución

Archivo principal: `src/components/renderers/index.ts`.

- El registro combina:
  - renderers built-in de core;
  - renderers externos permitidos por allowlist hardcodeada.
- La resolución usa selector por `id` y soporte por clave canónica.
- Para externos, la entrada solo se acepta si:
  1. el `packageManifest` pasa `validateMarketplaceIdentity`, y
  2. `buildMarketplaceToolKey(packageManifest)` coincide exactamente con la clave declarada.

Formato canónico:

`publisherId/repositoryId:toolKind/toolId@major`

Ejemplo:

`luxsequencer/core-renderers:renderer/webgl@1`

## 2) Contrato de renderer

Archivo: `src/components/renderers/types.ts`.

Campos relevantes de `RendererDefinition`:

- `id`, `name`, `component`
- `workerEntry`
- `workerRequirements`
- `packageManifest`
- `declarativeSchema`
- `controlSchema` (mantenido por compatibilidad de tipo; en oficiales se usa `[]`)

## 3) Controles de UI

Archivos:

- `src/components/renderers/shared/RendererControls.tsx`
- `src/components/controls/ControlPanel.tsx`

Estado actual:

- `RendererControls` renderiza **solo** `DeclarativeControlPanel`.
- No existe fallback runtime al esquema legacy.
- Los schemas React legacy (`*-schema.ts`/`*.tsx`) de renderers oficiales fueron removidos.

## 4) Pipeline y workers

Archivos:

- `src/components/renderers/pipeline/GraphicsPipelineHost.tsx`
- `src/graphics-pipeline/RendererWorkerManager.ts`

Flujo:

1. Se resuelve renderer activo desde store.
2. `GraphicsPipelineHost` valida requisitos/seguridad (checksum/firma para community cuando aplica).
3. Se crea `RendererWorkerManager` y se inicia handshake.
4. Se verifican protocolo y capacidades requeridas.
5. Se procesa salida de frames en compositor.

## 5) Workers externos en desarrollo (proxy)

Para evitar error cross-origin del constructor `Worker` entre puertos distintos:

- Base URL recomendada en core:
  - `VITE_MARKETPLACE_CORE_RENDERERS_BASE_URL=/marketplace-core-renderers/src/renderers/`
- Proxy dev en `luxsequencer-core/vite.config.ts`:
  - `/marketplace-core-renderers/* -> http://localhost:4174/*`

Esto permite que la URL final del worker sea same-origin respecto de la core app.

## 6) Repositorio externo

Ruta local actual:

- `../core-renderers`

Responsabilidades del repo externo:

- publicar workers (`*.worker.ts` en dev), manifests y catálogo;
- mantener identidad canónica consistente en manifests;
- ofrecer endpoint HTTP para consumo por core en desarrollo/entorno controlado.

## 7) Checklist para agregar un renderer oficial

1. Crear renderer + worker en `core-renderers`.
2. Definir `packageManifest` válido y clave canónica estable.
3. Agregar `declarativeSchema` completo (sin custom React legacy).
4. Exponer worker por URL bajo base de marketplace.
5. Agregar entrada en allowlist hardcodeada de core.
6. Validar:
   - `npm run type-check` en `luxsequencer-core`
   - `npm run validate:catalog` en `core-renderers`

## 8) Fuera de alcance actual

- Marketplace dinámico de compra/entitlements en runtime.
- Carga remota completa de contexto de performance.

Esa capa se integrará desde un repositorio dedicado en una fase posterior.
