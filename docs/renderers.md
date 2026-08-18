# Arquitectura del Sistema de Renderers (Actual)

Este documento describe el estado vigente del sistema de renderers en `0.6-beta`.

## Fuente de verdad

- La documentación de arquitectura de renderers en la core app vive en este archivo (`docs/renderers.md`).
- La documentación específica de cada renderer oficial vive en `core-renderers/src/renderers/*/README.md`.
- No se mantiene documentación técnica de arquitectura dentro de `src/components/renderers/docs`.

## Resumen

- Controles en modo **declarative-only**.
- El core **no contiene implementación local** de renderers oficiales (`webgl`, `concentric`, `dvd-screensaver`).
- El core mantiene únicamente: allowlist, identidad canónica, manifest y URL de worker externo.
- Carga de workers mediante proxy same-origin en desarrollo para evitar `SecurityError` al construir `Worker`.
- Política de carga externa con allowlist hardcodeada y validación estricta de clave canónica.

## 1) Registro y resolución

Archivo principal: `src/components/renderers/index.ts`.

- El registro combina:
  - renderers oficiales declarados por allowlist hardcodeada;
  - renderers externos permitidos por política.
- Las entradas oficiales de core son definiciones mínimas (sin componente React local) que apuntan a `workerEntry` remoto/proxied.
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
- `declarativeSchema` (opcional, no usado por las definiciones oficiales del core en el estado actual)
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

Ejemplo de documentación por renderer:

- `../core-renderers/src/renderers/dvd-screensaver/README.md`

## 7) Checklist para agregar un renderer oficial

1. Crear renderer + worker en `core-renderers`.
2. Definir `packageManifest` válido y clave canónica estable.
3. Exponer worker por URL bajo base de marketplace.
4. Agregar entrada en allowlist hardcodeada de core (`id`, `key`, `workerFileName`, `requiredCapabilities`, `packageManifest`).
5. Validar:
   - `npm run type-check` en `luxsequencer-core`
   - `npm run validate:catalog` en `core-renderers`

## 8) Fuera de alcance *de este archivo* — no del producto

> **Corregido el 2026-08-18.** Esta sección decía que el marketplace dinámico de compra y
> entitlements en runtime estaba "fuera de alcance" y que "esa capa se integrará desde un
> repositorio dedicado en una fase posterior". Eso ya no describe el rumbo: **el marketplace de
> terceros es el objetivo central del producto**, y la capa vive en `luxsequencer-cloud`, no en un
> repositorio dedicado por crear.

Lo que sigue fuera del alcance de **este documento**, que describe el sistema de renderers dentro
de la core app:

- El flujo de compra y la gestión de titularidad, que son de `luxsequencer-cloud`.
- La carga remota completa de contexto de performance.

Arquitectura objetivo punta a punta y huecos: `docs/next-steps/marketplace-de-terceros.md` en el
repo de workspace.

## 9) Licencias de marketplace

> **Construido e inactivo.** Verificado el 2026-08-18. Una versión anterior de esta sección se
> titulaba "Estado actual (implementado)" y describía en presente un mecanismo que no corre.

### Por qué no corre

El registro de renderers externos itera `HARDCODED_EXTERNAL_RENDERERS`, que es `[]`
(`src/components/renderers/index.ts:265`). El cuerpo del bucle —y con él toda la rama de licencias
de `:294`— **no se ejecuta en ninguna corrida real**. La maquinaria existe y tiene tests
(`marketplaceRegistry.test.ts` cubre token faltante y token válido), pero está apagada.

### Qué sobrevive y qué no

La arquitectura de entrega decidida el 2026-08-18 separa dos cosas que esta sección mezclaba:

- **Verificación de firma y checksum del código entregado** — el trust store
  (`src/graphics-pipeline/communityTrustStore.ts`, 919 líneas con 285 de tests), más
  `workerEntrySha256` y `workerEntrySignature` validados en `GraphicsPipelineHost.tsx:101` y
  `:131`. **Sobrevive y es requisito**: se va a ejecutar código de terceros en el browser del
  usuario, y hay que poder confirmar que los bytes son auténticos.

- **Token de licencia validado en el cliente** — `isMarketplaceLicenseTokenValid`
  (`src/components/renderers/sdk/licenseToken.ts`). **Superado.** Si cloud entrega los bytes sólo
  a quien compró, un chequeo de titularidad dentro del cliente no controla nada. Que la función
  decodifique el payload base64 y **nunca verifique la firma criptográfica** deja de ser un bug a
  corregir: es una pieza a retirar.

El flag `VITE_MARKETPLACE_ENFORCE_LICENSE_TOKENS` y su bypass global se reemplazan por un
`source: 'local-dev'` explícito en el manifest. Es lo que ya recomendaba la "Propuesta de
evolución" de esta misma sección, y quedó confirmado como el camino.

### Dónde está lo vigente

- Decisión de entrega: `docs/decisiones/2026-08-18-entrega-de-renderers.md` en el repo de
  workspace.
- Plan y huecos ordenados: `docs/next-steps/marketplace-de-terceros.md`, también en el workspace.
- Decisión del flag: [`docs/decisiones/2026-08-06-flag-desarrollo-renderers.md`](decisiones/2026-08-06-flag-desarrollo-renderers.md).

**El bloqueante real del marketplace no es la seguridad.** Es que
`applyRendererUniforms` (`GraphicsPipelineHost.tsx:233`) hardcodea los uniforms de cada renderer
con una cadena de `if` por id: un tercero no puede publicar un renderer funcional aunque supere
toda esta cadena de validación. Ver H1 del plan.
