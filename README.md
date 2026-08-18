# LuxSequencer Core

Aplicación principal de LuxSequencer para visualización generativa en tiempo real.

## Dónde encaja este repo

`luxsequencer-core` es la app principal: el secuenciador, el store y la UI. Es uno de los **cinco**
proyectos del ecosistema, junto a `core-renderers`, `lux-ui`, `luxsequencer-contracts` y
`luxsequencer-cloud`.

**La orquestación del ecosistema —topología, instalación, resolución de dependencias— vive en el
README del workspace, no acá.** Este repo se puede clonar suelto: baja `@luxsequencer/ui` y
`@luxsequencer/contracts` del registro npm y funciona.

---

## Estado actual

- Arquitectura de renderers basada en **workers externos**.
- Los **cuatro** renderers oficiales (`webgl`, `concentric`, `dvd-screensaver`, `diagnostic-fps`)
  viven en el repositorio hermano `core-renderers`. **Ninguno se implementa acá.**
- El core mantiene registro, allowlist, validación de identidad canónica, pipeline y UI de
  controles declarativos.

Para detalles de arquitectura: [docs/renderers.md](docs/renderers.md)

## Requisitos

- Node.js `18+` (recomendado `20+`)
- npm

## Instalación

Clonando este repo suelto:

```bash
npm install
```

Dentro del workspace, el `npm install` se corre una sola vez en la raíz. Ver su README.

## Desarrollo

### Opción A: solo core app

```bash
npm run dev     # puerto 3000
```

Los renderers oficiales no van a cargar: sin el marketplace levantado no hay de dónde bajar los
workers.

### Opción B: core + marketplace local (recomendado)

Requiere el repositorio hermano `core-renderers`.

```bash
npm run dev:all
```

Levanta `core-renderers` en el 4174 y esta app en el 3000, **en ese orden**, y la app proxea el
4174 bajo `/marketplace-core-renderers` (`vite.config.ts`). Si los levantás a mano, respetá el
orden. Que el 4174 devuelva 404 en `/` es esperado: no tiene `index.html`.

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
- `npm run lint` / `npm run lint:fix` → **`lint` falla aunque no haya errores**: corre con
  `--max-warnings 0` y hay ~260 warnings. Hoy no sirve como gate.
- `npx vitest run` → tests, una pasada. **Usar este, no `npm run test`**: el script `test` es
  `vitest` a secas, que arranca en modo watch y no termina.
- `npm run test:coverage` → una pasada, con cobertura

## Documentación técnica

- Arquitectura de renderers: [docs/renderers.md](docs/renderers.md)
- Variables de entorno: [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)
- Arquitectura de store: [docs/store-architecture.md](docs/store-architecture.md)
- UI system: [docs/ui-system.md](docs/ui-system.md)
- Testing: [docs/testing.md](docs/testing.md)
- i18n: [docs/i18n.md](docs/i18n.md)
- Doble pantalla: [docs/doble-pantalla.md](docs/doble-pantalla.md)

## Contratos compartidos

Este repo consume contratos de tipos desde `@luxsequencer/contracts`, declarado como `^0.1.0`.
Dentro del workspace npm enlaza la carpeta local; clonando suelto, lo baja del registro.

Reglas para mantener consistencia entre repos:

- No duplicar contratos de dominio/API en `core` si ya existen en `@luxsequencer/contracts`.
- Usar `src/types/*` solo como adaptadores locales para tipos internos de UI/estado.
- Ante cambios de contrato, actualizar primero `luxsequencer-contracts` y luego consumidores.

Referencia de imports:

- `import type { DeclarativeControlSchema } from '@luxsequencer/contracts/declarative-controls'`
- `import type { PackageManifestV1 } from '@luxsequencer/contracts/marketplace'`
- `import type { ApiError } from '@luxsequencer/contracts/api'`

## Repos relacionados

| Repo | Qué aporta |
|---|---|
| `core-renderers` | los cuatro renderers oficiales, como workers |
| `lux-ui` | `@luxsequencer/ui`, componentes compartidos |
| `luxsequencer-contracts` | `@luxsequencer/contracts`, tipos compartidos |
| `luxsequencer-cloud` | cuentas, performances guardadas, marketplace |

Cómo se clonan y se enlazan: README del repo de workspace.

## Licencia

**Sin definir todavía.** El archivo [`LICENSE`](LICENSE) existe pero está **vacío (0 bytes)**, y
`package.json` no declara campo `license`. Sin licencia explícita, el default legal es *todos los
derechos reservados*.

Una versión anterior de este README afirmaba GPL-3.0. No era cierto: no hay texto de licencia en
ningún lado. La decisión está abierta y es un bloqueante registrado del modelo de distribución
—ver `docs/next-steps/bloqueantes-modelo-distribucion.md` en el repo del workspace—, así que no se
resuelve acá.
