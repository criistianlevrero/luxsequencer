# Estado de `luxsequencer-core`

**Última verificación**: 2026-08-12 · **Protocolo**: ver `STATUS-PROTOCOL.md` del directorio raíz.

Vocabulario: `IMPLEMENTADO` · `PARCIAL` · `PLANEADO` · `DESCARTADO`.
Toda fila `IMPLEMENTADO` o `PARCIAL` **debe citar un archivo**.

Auditoría completa: [docs/auditoria/2026-08-12-fase-2-core.md](docs/auditoria/2026-08-12-fase-2-core.md).

## Qué es este repo, en una línea

La aplicación de LuxSequencer: store Zustand de 9 slices, secuenciador de patrones y de
propiedades, MIDI, doble pantalla y un compositor WebGL que mezcla frames de renderers que corren
como workers externos servidos por `core-renderers`.

Es el 70% del código del ecosistema: 127 archivos `.ts`/`.tsx`, 20.419 líneas.

## Verificación ejecutada

| Comando | Resultado | Fecha |
|---|---|---|
| `npx tsc --noEmit` | limpio, exit 0 | 2026-08-12 |
| `npx vitest run` | **5 fallan / 88**, en 3 archivos de 23 | 2026-08-12 |
| `npx eslint . --ext ts,tsx` | **0 errores, 260 warnings** | 2026-08-12 |
| `npm run lint` | **falla** — `--max-warnings 0` contra 260 warnings | 2026-08-12 |
| `npx vite build` | limpio, 2.04s, 371 módulos. JS 520.93 kB en un solo chunk | 2026-08-12 |

Dos avisos operativos:

- **`npm test` arranca vitest en modo watch y se cuelga.** Usar `npx vitest run`.
- **Los 5 tests que fallan tienen dos causas raíz, no una** (el `STATUS.md` de la raíz decía que
  una hasta el 2026-08-12). `Sequencer.test.tsx` (2) y `ui.slice.test.ts` (1) fallan por un
  `vi.mock` incompleto de `../../components/renderers`; `project.slice.test.ts` (2) falla por un
  harness de store al que le falta `hydrateRendererAnimatableProperties`.

Los cuatro gates existen y **ninguno puede bloquear un merge**: no hay CI, y el lint está roto
como gate por configuración. `.github/` sólo contiene `copilot-instructions.md`.

## Capacidades

| Capacidad | Estado | Evidencia | Notas |
|---|---|---|---|
| Compositor WebGL con crossfade entre dos fuentes | IMPLEMENTADO | `src/graphics-pipeline/WebGLCompositor.ts`, `GraphicsPipelineHost.tsx:518-542` | Transición de 800 ms; máximo 2 workers vivos |
| Runtime worker-only de renderers | IMPLEMENTADO | `src/graphics-pipeline/RendererWorkerManager.ts` | Sin ruta de render en main thread |
| Handshake con protocolo y capabilities | IMPLEMENTADO | `src/components/renderers/sdk/validateRendererSdkContract.ts` | Versión + capacidades requeridas |
| Health-check y detección de stalls | IMPLEMENTADO | `GraphicsPipelineHost.tsx:393-409` | Timeout de 3000 ms por default |
| Allowlist de renderers con clave canónica | IMPLEMENTADO | `src/components/renderers/index.ts:147-240` | 4 entradas, manifests copiados a mano desde `core-renderers` |
| Store Zustand de 9 slices | IMPLEMENTADO | `src/store/index.ts:56-73` | La doc documenta 7 |
| Secuenciador de patrones | IMPLEMENTADO | `src/store/slices/sequencer.slice.ts` | 8–32 pasos, 30–240 BPM, compensación de drift |
| Secuenciador de propiedades (keyframes) | IMPLEMENTADO | `src/store/slices/sequencer.slice.ts` | Loop de RAF, interpolación lineal |
| Sistema de animación con prioridades | IMPLEMENTADO | `src/store/slices/animation.slice.ts` | MIDI > UI > PropertySequencer > PatternSequencer |
| MIDI con Web MIDI API y MIDI Learn | IMPLEMENTADO | `src/store/slices/midi.slice.ts` | Mappings por proyecto |
| Doble pantalla vía `BroadcastChannel` | IMPLEMENTADO | `src/store/slices/dualScreen.slice.ts:43-225` | El broadcast vive en el slice, **no** en el middleware que la doc cita |
| Controles declarativos | PARCIAL | `src/components/declarative/ControlRenderer.tsx` | Implementa 8 de los 10 `ControlType` del contrato. Faltan `curve` y `matrix`, y el `switch` no tiene `default`: falla silenciosa. Ver C5 |
| Persistencia en localStorage | IMPLEMENTADO | `src/index.tsx:53-70`, `src/store/slices/project.slice.ts` | Auto-save en cada `setProject()` |
| Migración de settings entre versiones | IMPLEMENTADO | `src/utils/settingsMigration.ts` | 516 líneas, con tests |
| i18n | IMPLEMENTADO | `src/i18n/translations.ts` | 366 líneas, locale persistido |
| Error boundary de renderer | IMPLEMENTADO | `MainViewport.tsx:32`, `MainApp.tsx:139`, `SecondaryDisplay.tsx:99` | Cableado en los tres caminos de render, incluida la ventana secundaria |
| Proxy same-origin a `core-renderers` en dev | IMPLEMENTADO | `vite.config.ts:10-16` | `/marketplace-core-renderers` → `localhost:4174` |
| Consumo de `@luxsequencer/contracts` | IMPLEMENTADO | `src/types/declarativeControls.ts:1-25` | Re-export + adaptación, no duplicación |
| Verificación SHA-256 del `workerEntry` | PARCIAL | `GraphicsPipelineHost.tsx:96-124` | Gateada en `source === 'community'`. **Cero paquetes community existen**: no corre nunca fuera de los tests. Ver C3 |
| Verificación de firma ECDSA P-256 | PARCIAL | `GraphicsPipelineHost.tsx:126-200` | Ídem |
| Trust store con revocación y rotación de root keys | PARCIAL | `src/graphics-pipeline/communityTrustStore.ts` | 919 líneas, el archivo más grande del repo. Ídem: sin consumidor real |
| Validación de tokens de licencia | PARCIAL | `src/components/renderers/sdk/licenseToken.ts` | Ídem. Su eliminación ya está decidida: ver [decisión del flag](docs/decisiones/2026-08-06-flag-desarrollo-renderers.md) |
| Registro de renderers externos (marketplace) | PARCIAL | `src/components/renderers/index.ts:278-320` | La función existe y tiene tests, pero `HARDCODED_EXTERNAL_RENDERERS` es `[]` (`:265`): siempre devuelve `{}` |
| Uniforms genéricos por renderer | PLANEADO | — | Hoy hay una rama `if (rendererId === ...)` por renderer dentro del host (`GraphicsPipelineHost.tsx:233-351`). Bloqueante real del marketplace. Ver C1 |
| Carga de repos 3rd-party desde `localStorage` | PLANEADO | — | `graphics-pipeline-refactor.md:359` lo da por hecho. La clave `luxsequencer.marketplace.tree.v1` no existe en el código |
| `entitlements.allowedToolKeys` | PLANEADO | — | `graphics-pipeline-refactor.md:360` lo da por hecho. No existe en el código |
| Sistema de grabación de performances | PLANEADO | `src/store/slices/recording.slice.ts` | **Archivo vacío (0 bytes)** commiteado. Spec en `docs/next-steps/sistema-de-grabacion.md` |
| Sistema de recuperación de errores | PARCIAL | `src/utils/errorRecovery.ts` | **Módulo huérfano**: 630 líneas, cero importadores |
| Monitor de performance en pantalla | PARCIAL | `src/components/debug/PerformanceMonitor.tsx` | **Módulo huérfano**: 455 líneas, nunca se monta. El que sí se monta es `DebugOverlay` |
| CI | PLANEADO | — | No existe |
| Licencia abierta | PLANEADO | — | **`LICENSE` pesa 0 bytes** y `package.json` no tiene campo `license`. El README afirma GPL-3.0. Ver bloqueantes de la raíz |

## Deuda crítica

1. **C1 — El host del pipeline hardcodea cada renderer.** `applyRendererUniforms`
   (`GraphicsPipelineHost.tsx:233-351`) resuelve los uniforms con una cadena de `if (rendererId
   === ...)`. Cada renderer nuevo obliga a editar, recompilar y publicar el core. Es el
   bloqueante real de un marketplace de terceros, y contradice toda la infraestructura de
   identidad canónica, manifests y firma que el repo construyó alrededor. La rama de
   `diagnostic-fps` además **genera datos** en el core (`:261-297`).

2. **C2 — Cinco tests en rojo y ningún gate que los frene.** 5/88 desde hace meses, con dos
   causas raíz. Sin CI, y con el lint inutilizable como gate por `--max-warnings 0` contra 260
   warnings.

3. **C3 — La seguridad de paquetes community es infraestructura sin consumidor.** ~1.100 líneas
   (trust store, firma ECDSA, checksum SHA-256, tokens) más 15 variables de entorno, todas
   gateadas en `manifest.source === 'community'`, sin que exista un solo paquete community. Sólo
   la ejercitan los tests. Se paga además un `fetch` completo del worker en cada cambio de
   renderer (`:202-231`) cuyo único fin es una validación que después se saltea.

## Deuda no crítica

- **C4** — 1.923 líneas de código muerto (≈9,4%): `errorRecovery.ts` (630),
  `PerformanceMonitor.tsx` (455), `hotReload.tsx` (278, sombreado por `hotReload.ts`),
  `dependencyUtils.ts` (218), `EnhancedControlPanel.tsx` (204), `dualScreen.middleware.ts` (124),
  `declarative/controls/index.ts` (12), `controls/SliderInput.tsx` (2) y `recording.slice.ts`
  (0, vacío). Más `default-project.json` duplicado byte a byte entre la raíz y `public/`.
- **C5** — El contrato declara 10 `ControlType` y el core implementa 8. `curve` y `matrix`
  type-checkean y no renderizan, sin aviso.
- **C6** — Los uniforms se empujan en **cada** cambio del store, sin selector
  (`GraphicsPipelineHost.tsx:557-559`). Investigación abierta con una medición hecha en
  [`docs/next-steps/pipeline-cadence.md`](docs/next-steps/pipeline-cadence.md).
- **C7** — El compositor aplica `UNPACK_FLIP_Y_WEBGL` a toda fuente
  (`WebGLCompositor.ts:228`) y cada worker lo compensa por su cuenta: `diagnostic-fps` voltea a
  mano, `concentric` lo esconde por simetría y **`dvd-screensaver` se ve invertido**. La
  orientación esperada del `ImageBitmap` no está escrita en ningún contrato. Heredado como R1 de
  la auditoría de `core-renderers`, que dejó la decisión para este repo.
- **C8** — Bundle de 520.93 kB en un único chunk, sin `manualChunks`.
- **C9** — `LICENSE` vacío contra un README que afirma GPL-3.0.
- **C10** — Ruido menor: `logEnvConfig()` es un no-op que igual se llama en el arranque
  (`config.ts:150`), bloque comentado en `MainApp.tsx:177-181`, y el alias
  `_useRendererHotReload` que sugiere desuso cuando sí se invoca (`MainApp.tsx:24` y `:65`).

## Pendiente de rollout del protocolo

- **README sin recortar.** Drift verificado en 5 puntos (D1–D5 de la auditoría): dice que el
  ecosistema tiene cuatro repos y son cinco; describe una instalación con `npm link` y repos
  sueltos que ya no es la topología vigente; lista 3 renderers oficiales cuando son 4; afirma
  GPL-3.0 con un `LICENSE` vacío; y publica `npm run test`, que se cuelga en modo watch.

- ~~**`.github/copilot-instructions.md` y `src/components/ui/README.md` sin corregir.**~~
  ✅ **Corregidos el 2026-08-18.** Los dos describían arquitectura removida, y el primero es el
  que los agentes leen automáticamente. Se aplicó arreglo quirúrgico: donde el conocimiento ya
  vivía en `docs/`, ahora se apunta en vez de duplicar. Se agregó el contexto de ecosistema, que
  faltaba entero, y se corrigieron los 20 enlaces del documento, que no resolvían porque estaban
  escritos relativos a la raíz del repo y el archivo vive en `.github/`. Detalle en
  [el informe de drift](docs/auditoria/2026-08-06-drift-copilot-instructions.md).

- **`docs/next-steps/graphics-pipeline-refactor.md` está mal archivado.** ~90% describe trabajo
  terminado (fases 1 a 4 marcadas "completada") y contiene dos afirmaciones de funcionalidad
  inexistente (D8, D9). Es documentación de arquitectura vigente dentro de la carpeta de trabajo
  planeado.

- **`docs/testing.md` y `docs/store-architecture.md` sin línea de estado ni fecha.** El resto de
  `docs/` tampoco la tiene, salvo `pipeline-cadence.md`, que es el modelo a seguir.

Nada de esto se tocó en la sesión de auditoría, por la regla de no arreglar documentación sobre
la marcha.
