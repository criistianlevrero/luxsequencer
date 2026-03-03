# Refactor Pipeline Gráfico v2

## 1. Objetivo

Consolidar el sistema de renderers en una arquitectura desacoplada y **worker-only** con:

- Renderers ejecutándose en Web Workers.
- Cada renderer renderizando en su propio OffscreenCanvas.
- Un compositor central en el main thread que mezcla texturas.
- Soporte de transición suave (crossfade) entre dos renderers activos.
- Aislamiento obligatorio de plugins/renderers comunitarios (sin acceso a DOM ni React).

## 2. Arquitectura General

### Antes (legacy)

`Renderer → Canvas final`

### Después (actual)

`RendererWorker A → OffscreenCanvas A`

`RendererWorker B → OffscreenCanvas B`

Main thread (Compositor WebGL):

- Recibe `ImageBitmap` de A.
- Recibe `ImageBitmap` de B.
- Mezcla ambas texturas.
- Renderiza al canvas final.

## 2.1 Estado actual (Marzo 2026)

- Pipeline v2 activo como camino principal de render.
- `webgl`, `concentric` y `dvd-screensaver` migrados a worker entrypoint.
- `webgl-legacy` removido del registro.
- `RendererDefinition` requiere `workerEntry`.
- Sin fallback al renderer en main thread para ejecución normal.

## 3. Componentes

### 3.1 RendererWorker

Cada renderer corre en un Worker independiente.

**Responsabilidades**

- Crear su contexto WebGL2 sobre OffscreenCanvas.
- Ejecutar su propio render loop.
- Enviar frame actual como `ImageBitmap`.
- Recibir updates de uniforms.
- Manejar `init` / `dispose`.

**No puede**

- Acceder al DOM.
- Acceder a estado React.
- Controlar canvas final.

### 3.2 Compositor (Main Thread)

**Responsabilidades**

- Crear contexto WebGL2 en canvas final.
- Mantener 2 texturas activas (A y B).
- Ejecutar shader de mezcla.
- Controlar progreso de transición.
- Gestionar lifecycle de workers.

## 4. Flujo de Inicialización

### 4.1 Crear renderer

```ts
function createRendererInstance(rendererUrl: string) {
  const worker = new Worker(rendererUrl, { type: 'module' })
  const offscreen = new OffscreenCanvas(width, height)

  worker.postMessage(
    {
      type: 'init',
      canvas: offscreen,
      width,
      height,
    },
    [offscreen],
  )

  return worker
}
```

## 5. Protocolo de Comunicación

### Main → Worker

```ts
type InitMessage = {
  type: 'init'
  canvas: OffscreenCanvas
  width: number
  height: number
}

type UpdateUniformMessage = {
  type: 'updateUniform'
  name: string
  value: unknown
}

type ResizeMessage = {
  type: 'resize'
  width: number
  height: number
}

type DisposeMessage = {
  type: 'dispose'
}
```

### Worker → Main

```ts
type FrameMessage = {
  type: 'frame'
  bitmap: ImageBitmap
}
```

## 6. Render Loop en Worker

```ts
let gl: WebGL2RenderingContext | null
let canvas: OffscreenCanvas

self.onmessage = async (e) => {
  switch (e.data.type) {
    case 'init':
      canvas = e.data.canvas
      gl = canvas.getContext('webgl2')
      startLoop()
      break
  }
}

function startLoop() {
  function render() {
    if (!gl) return

    drawScene(gl)

    const bitmap = canvas.transferToImageBitmap()
    self.postMessage({ type: 'frame', bitmap }, [bitmap])

    requestAnimationFrame(render)
  }

  render()
}
```

## 7. Compositor WebGL (Main Thread)

El compositor:

- Tiene su propio contexto WebGL2.
- Mantiene dos texturas (`textureA` y `textureB`).
- Ejecuta un shader de mezcla.

Shader base:

```glsl
uniform sampler2D texA;
uniform sampler2D texB;
uniform float mixFactor;

void main() {
  vec4 colorA = texture(texA, uv);
  vec4 colorB = texture(texB, uv);
  outColor = mix(colorA, colorB, mixFactor);
}
```

## 8. Ciclo de Vida de un Renderer

Estados:

- `idle`
- `initializing`
- `active`
- `transitioning-out`
- `disposed`

### 8.1 Activación inicial

- Se crea `Renderer A`.
- A renderiza solo.
- `mixFactor = 0`.
- `texB` vacío.

### 8.2 Cambio de renderer

- Se crea `Renderer B`.
- Ambos renderizan en paralelo.
- Se inicia transición: `mixFactor: 0 → 1` en `800ms`.
- Al terminar: se hace `dispose` de A y B pasa a principal.

## 9. Gestión de Transición

Estado en compositor:

```ts
let activeRenderer
let nextRenderer
let transitionProgress = 0
let isTransitioning = false
```

Durante transición:

```ts
transitionProgress += deltaTime / duration

if (transitionProgress >= 1) {
  terminate(activeRenderer)
  activeRenderer = nextRenderer
  nextRenderer = null
  isTransitioning = false
}
```

## 10. Performance

Puntos críticos:

- No recrear textura por frame (reutilizar).
- Liberar `ImageBitmap` luego de subir a GPU.
- Limitar a 2 workers activos máximo.
- Terminar worker si no responde.

Adicionalmente ya aplicado:

- Estrategia latest-frame-wins por fuente (`A`/`B`).
- Cierre defensivo de bitmaps reemplazados para evitar acumulación.

## 11. Cambios en Renderers Existentes

Cada renderer actual debe:

- Eliminar acceso directo al DOM.
- Eliminar acceso al canvas principal.
- Migrar a un worker entrypoint.
- Aceptar un `RendererContext` reducido.
- Evitar APIs no permitidas en Worker.
- Mantener su configuración de UI en esquema declarativo.
- Declarar `workerEntry` obligatorio para ser cargable por el runtime.

## 11.1 Política de Controles (Declarativo Estricto)

Para mantener el ecosistema desacoplado y auditable, el pipeline adopta una política estricta:

- Los renderers solo pueden declarar controles mediante tipos permitidos del core.
- Se elimina la posibilidad de inyectar controles custom directamente en el panel desde un renderer/plugin.
- El panel de controles queda bajo control del core y no del plugin.

### Reglas

- Permitido: controles declarativos (`slider`, `select`, `toggle`, `color`, etc. definidos por el core).
- No permitido: `type: 'custom'` o componentes React embebidos desde renderers externos.
- No permitido: acceso directo al árbol UI del panel por parte de plugins.

### Extensión del catálogo de controles

Si un desarrollador externo necesita un control nuevo:

1. Propone el nuevo tipo de control vía PR al core.
2. El equipo revisa API, accesibilidad, rendimiento, seguridad y compatibilidad MIDI.
3. Si se aprueba, el control se incorpora al sistema declarativo oficial.
4. Desde ese momento puede ser consumido por cualquier renderer de forma estándar.

Resultado: plugins desacoplados, UX consistente y superficie de ataque/control más auditada.

### Enforzarlo en TypeScript (compile-time)

```ts
export type AllowedControlType =
  | 'slider'
  | 'color'
  | 'gradient'
  | 'select'
  | 'toggle'
  | 'vector2d'
  | 'range'
  | 'curve'
  | 'matrix'
  | 'text'

export interface RendererControlSpec {
  standard: Array<{
    id: string
    type: AllowedControlType
    category: string
    label: string
    constraints: ControlConstraints
  }>
}
```

Con este contrato, cualquier intento de agregar `type: 'custom'` desde un renderer falla en compilación.

### Transición y deprecación del camino legacy

- Se mantiene un flag temporal de migración: `VITE_ALLOW_LEGACY_CUSTOM_CONTROLS`.
- Valor por defecto: `false`.
- Uso permitido: solo compatibilidad temporal en renderers legacy no migrados.
- Objetivo de retiro: eliminar este flag y el soporte legacy en la versión `v0.7.0` (Q2 2026), sujeto a completar la migración de renderers internos.

Nota: esta transición aplica a controles custom legacy. La ejecución de renderers en main thread quedó fuera del camino principal.

## 12. Etapas de Refactor Recomendadas

### Fase 1 — Base pipeline (completada)

- Implementar compositor vacío.
- Migrar 1 renderer a Worker.
- Probar render simple sin transición.

### Fase 2 — Transiciones y migración inicial (completada)

- Implementar segundo renderer simultáneo.
- Implementar crossfade básico.

### Fase 3 — Worker-only runtime (completada)

- Implementar sistema formal de lifecycle.
- Remover ruta legacy de render en main thread.
- Exigir `workerEntry` para renderers registrados.

### Fase 4 — Endurecimiento SDK/Sandbox (en curso)

- ✅ Contrato estable de protocolo para renderers comunitarios (versión + capacidades).
- ✅ Validación de handshake/capabilities al cargar plugins.
- ✅ Métricas de backpressure, drops y health-check por worker.
- ✅ Política de manifest por paquete (`builtin`/`community`) con requisitos mínimos de SDK.
- ✅ Verificación real de integridad SHA-256 de `workerEntry` para paquetes community antes de iniciar el worker.
- ✅ Verificación criptográfica de firma del paquete community (ECDSA P-256 + SHA-256) antes de iniciar el worker.
- ✅ Trust store configurable para community packages con revocación explícita y ventanas de vigencia por clave.
- ✅ Distribución remota del trust store con versionado mínimo, timeout y fallback a cache/local.
- ⏳ Pendiente: gobernanza operativa avanzada del trust store (canal firmado para metadata, rotación automática y revocación centralizada).

## 13. Decisiones Arquitectónicas

- El plugin nunca controla el canvas final.
- El compositor es autoridad visual.
- Solo 2 renderers activos simultáneamente.
- La transición es responsabilidad del core.
- Los controles de renderers son declarativos y de catálogo cerrado auditado por el core.

## 14. Beneficios del Pipeline

- Transiciones suaves.
- Base para transiciones shader-based futuras.
- Base para grabación.
- Base para streaming.
- Base para efectos globales.
- Base para marketplace profesional.

## 15. Próximos Pasos

Cuando esté estable:

- Formalizar Plugin SDK worker-only (protocolo, ciclo de vida, límites).
- Separar renderers en repos externos.
- Endurecer sistema de firma y verificación de paquetes (gobernanza del trust store y distribución segura de claves).
- Introducir sistema de licencia.

## 16. Riesgos y Mitigaciones

### 16.1 Backpressure de frames

**Riesgo:** el worker produce `ImageBitmap` más rápido de lo que el compositor consume.

**Mitigación:**

- Usar estrategia latest-frame-wins (reemplazar frame pendiente por el más nuevo).
- Limitar cola por renderer a tamaño 1.
- Medir tiempo de subida a GPU y tasa de drop.

### 16.2 Fugas de memoria GPU/CPU

**Riesgo:** acumulación de bitmaps/texturas no liberadas durante transiciones largas.

**Mitigación:**

- Llamar `bitmap.close()` inmediatamente después de `texSubImage2D`.
- Reutilizar texturas por slot (`A`, `B`) en vez de recrearlas por frame.
- Hacer `dispose` explícito de recursos WebGL al terminar renderer.

### 16.3 Lifecycle inconsistente de workers

**Riesgo:** workers huérfanos o estados inválidos tras cambios rápidos de renderer.

**Mitigación:**

- Definir máquina de estados estricta (`idle → initializing → active → transitioning-out → disposed`).
- Ignorar mensajes fuera de estado esperado.
- Aplicar timeout de health-check y `terminate()` defensivo.

### 16.4 Desalineación temporal en transición

**Riesgo:** mezcla visual irregular por drift entre clocks de workers y main thread.

**Mitigación:**

- Usar tiempo de transición definido solo en compositor.
- Tratar bitmaps como snapshots, no como fuente de tiempo.
- Basar `mixFactor` en `deltaTime` del main thread.

### 16.5 Compatibilidad de plataforma

**Riesgo:** diferencias de soporte de `OffscreenCanvas`/WebGL en Worker según navegador.

**Mitigación:**

- Añadir feature detection al iniciar pipeline.
- Mostrar estado no disponible y bloquear carga del renderer cuando no haya soporte mínimo.
- Registrar capacidades detectadas en modo debug.