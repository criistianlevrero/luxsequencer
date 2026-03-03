# LuxSequencer Core

Aplicación principal de LuxSequencer para visualización generativa en tiempo real.

## Estado actual

- Arquitectura de renderers basada en **workers externos**.
- Renderers oficiales (`webgl`, `concentric`, `dvd-screensaver`) viven en el repositorio hermano `core-renderers`.
- El core mantiene registro, allowlist, validación de identidad canónica, pipeline y UI de controles declarativos.

Para detalles de arquitectura: [docs/renderers.md](docs/renderers.md)

## Requisitos

- Node.js `18+` (recomendado `20+`)
- npm

## Instalación

Desde este repositorio (`luxsequencer-core`):

```bash
npm install
```

## Desarrollo

### Opción A: solo core app

```bash
npm run dev
```

### Opción B: core + marketplace local (recomendado)

Requiere tener el repositorio hermano `../core-renderers`.

```bash
npm run dev:all
```

Si necesitás reinicio limpio de ambos servidores:

```bash
npm run dev:all:clean
```

## Variables de entorno

Configuración completa: [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)

Variable clave para renderers oficiales en desarrollo:

- `VITE_MARKETPLACE_CORE_RENDERERS_BASE_URL=/marketplace-core-renderers/src/renderers/`

## Scripts principales

- `npm run dev` → desarrollo (Vite)
- `npm run dev:all` → levanta `core-renderers` + `luxsequencer-core`
- `npm run build` → build producción
- `npm run preview` → preview local de build
- `npm run type-check` → chequeo TypeScript
- `npm run lint` / `npm run lint:fix`
- `npm run test` / `npm run test:watch` / `npm run test:coverage`

## Documentación técnica

- Arquitectura de renderers: [docs/renderers.md](docs/renderers.md)
- Variables de entorno: [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)
- Arquitectura de store: [docs/store-architecture.md](docs/store-architecture.md)
- UI system: [docs/ui-system.md](docs/ui-system.md)
- Testing: [docs/testing.md](docs/testing.md)
- i18n: [docs/i18n.md](docs/i18n.md)
- Doble pantalla: [docs/doble-pantalla.md](docs/doble-pantalla.md)

## Repos relacionados

- Core app: `luxsequencer-core` (este repo)
- Marketplace oficial de renderers: `../core-renderers`

## Licencia

GPL-3.0. Ver [LICENSE](LICENSE).
