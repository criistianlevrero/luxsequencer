# Cadencia de datos del pipeline gráfico

> **Estado**: PLANEADO · **Última verificación**: 2026-08-09

## Problema observado

Tirones visibles durante la ejecución, sin caída correspondiente de FPS. El síntoma reportado no
es "va lento": es que el movimiento se entrecorta mientras el render sigue corriendo.

## Hipótesis

Los tirones no vienen del render sino de la **cadencia con que llegan los datos** al worker.

El compositor corre en `requestAnimationFrame`, que es regular
([GraphicsPipelineHost.tsx:542](../../src/components/renderers/pipeline/GraphicsPipelineHost.tsx#L542)).
Los uniforms, en cambio, se empujan desde la suscripción al store
([GraphicsPipelineHost.tsx:557-559](../../src/components/renderers/pipeline/GraphicsPipelineHost.tsx#L557-L559)):

```ts
unsubscribeStoreRef.current = useTextureStore.subscribe((state) => {
  syncUniforms(state);
});
```

De ahí salen tres propiedades que sostienen la hipótesis:

1. **Cadencia irregular.** Se dispara cuando cambia el store, no a intervalo fijo. Ráfagas y
   silencios, contra un render liso.
2. **Sin diff.** `applyRendererUniforms` reenvía *todos* los uniforms del renderer en *cada*
   cambio de store, aunque no haya cambiado ninguno.
3. **Doble costo en transición.** `syncUniforms` corre para el renderer activo **y** para el
   siguiente ([:482-493](../../src/components/renderers/pipeline/GraphicsPipelineHost.tsx#L482-L493)),
   así que durante un crossfade se duplican los `postMessage`.

Si la hipótesis es correcta, el jitter en el canal de datos se ve como tirón aunque los FPS estén
clavados en 60.

## El instrumento (ya existe)

El renderer `diagnostic-fps` está construido para falsar esto. No es un renderer visual: es una
sonda.

| Métrica en pantalla | Qué responde |
|---|---|
| `Render FPS` | ¿el loop de dibujo está sano? |
| `Data updates/s` | ¿a qué ritmo llegan los datos, comparado con el render? |
| `Avg data interval` + `Data jitter (σ)` | ¿la llegada es regular o a ráfagas? |
| Gráfico de barras con umbral rojo | ¿hay picos aislados, y de qué tamaño? |
| `Last heartbeat` | ¿hay cortes largos de datos? |

Evidencia: `core-renderers/src/renderers/diagnostic-fps/diagnostic-fps.worker.ts`, registrado en
[`components/renderers/index.ts`](../../src/components/renderers/index.ts) y alimentado desde
[`GraphicsPipelineHost.tsx:239-296`](../../src/components/renderers/pipeline/GraphicsPipelineHost.tsx#L239-L296).

### Cómo usarlo para decidir

Dos perillas separan las dos causas posibles. Se mueven de a una:

- **`Synthetic Payload Size`** (0 → 64 KB): agrega relleno a cada mensaje sin cambiar la
  frecuencia. Si los tirones empeoran al subirlo, el cuello es el **tamaño** del mensaje (costo de
  structured clone) → la solución va por adelgazar el payload.
- **`Synthetic Signals`** (1 → 32): agrega valores animados por mensaje.
- **`Target FPS`**: si el jitter de datos no se mueve al cambiar los FPS de render, confirma que
  los dos canales están desacoplados y el problema es sólo del canal de datos.

Si en cambio el jitter es alto con payload en 0, el cuello es la **frecuencia e irregularidad** de
los envíos, no su tamaño.

## Opciones de arreglo (sin decidir)

No elegir ninguna antes de tener la medición.

| Opción | Qué hace | Costo / riesgo |
|---|---|---|
| **Dedupe de uniforms** | Reenviar sólo lo que cambió, con el patrón ya prototipado en `diagnosticConfigCache` ([:54](../../src/components/renderers/pipeline/GraphicsPipelineHost.tsx#L54)) | Barato y localizado. No arregla la irregularidad si los valores *sí* cambian seguido |
| **Colgar `syncUniforms` del rAF** | Desuscribir del store; leer el estado una vez por frame | Cadencia regular por construcción. Cambia el timing de todos los renderers; puede atrasar un frame la respuesta a input |
| **Adelgazar el payload** | Mandar números planos en vez de objetos anidados | Sólo tiene sentido si la medición culpa al tamaño |

El dedupe está aplicado **sólo a `diagnostic-fps`** a propósito: generalizarlo toca el camino de
render de todos los renderers y merece medirse antes y después con esta misma sonda.

## Estado de las piezas

| Pieza | Estado | Evidencia |
|---|---|---|
| Sonda de cadencia | IMPLEMENTADO | `core-renderers/src/renderers/diagnostic-fps/` |
| Dedupe de uniforms de config | PARCIAL | [:281-288](../../src/components/renderers/pipeline/GraphicsPipelineHost.tsx#L281-L288) — sólo para `diagnostic-fps` |
| Medición hecha con la sonda | PLANEADO | — |
| Arreglo de la cadencia | PLANEADO | — |

## Nota

`diagnostic-fps` queda visible en el selector de renderers, sin gate. Es una decisión consciente
mientras dure la investigación; si el renderer sobrevive a la investigación, revisar contra
[la decisión de flag de desarrollo de renderers](../../../docs/decisiones/2026-08-06-flag-desarrollo-renderers.md).
