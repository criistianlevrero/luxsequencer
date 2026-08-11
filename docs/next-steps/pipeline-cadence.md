# Cadencia de datos del pipeline gráfico

> **Estado**: PLANEADO · **Última verificación**: 2026-08-10

Investigación abierta sobre tirones en la ejecución. La sonda está construida y **hay una primera
medición hecha** (ver más abajo); el arreglo no está decidido porque la medición descartó una
hipótesis sin confirmar otra.

## Problema observado

Tirones visibles durante la ejecución, sin caída correspondiente de FPS. El síntoma reportado no
es "va lento": es que el movimiento se entrecorta mientras el render sigue corriendo.

## Hipótesis original

> Registrada tal como se formuló antes de medir. Ver [Resultado](#resultado-de-la-medición) para
> qué sobrevivió.

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

De ahí salen tres propiedades que la sostenían:

1. **Cadencia irregular.** Se dispara cuando cambia el store, no a intervalo fijo. Ráfagas y
   silencios, contra un render liso.
2. **Sin diff.** `applyRendererUniforms` reenvía *todos* los uniforms del renderer en *cada*
   cambio de store, aunque no haya cambiado ninguno.
3. **Doble costo en transición.** `syncUniforms` corre para el renderer activo **y** para el
   siguiente ([:482-493](../../src/components/renderers/pipeline/GraphicsPipelineHost.tsx#L482-L493)),
   así que durante un crossfade se duplican los `postMessage`.

## El instrumento

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

### Cómo leer el gráfico

`Graph Max Interval` hay que bajarlo a ~50 ms antes de mirar nada. El default de 200 ms aplasta
toda la señal contra el piso del cuadro cuando la media real es ~13 ms, y hace que intervalos muy
distintos se vean idénticos. La primera lectura de la medición de abajo se hizo con el default y
no mostraba estructura; con la escala corregida el patrón salta a la vista.

## Resultado de la medición

**Fecha**: 2026-08-09 · **Renderer activo**: `diagnostic-fps` · **Sequencer**: corriendo a 120 BPM

Dos capturas, la segunda con la escala del gráfico corregida (`Graph Max Interval` 50 ms,
`Stall Threshold` 30 ms):

| Dato | Lectura 1 | Lectura 2 |
|---|---|---|
| Render FPS | 58.8 | 58.8 |
| Data updates/s | 75.5 | 75.0 |
| Avg data interval | 13.2 ms | 13.3 ms |
| Data jitter (σ) | 5.6 ms | 5.8 ms |
| Probe payload | 0 bytes | 0 bytes |
| Barras sobre el umbral | 0 (umbral 120 ms) | 0 (umbral 30 ms) |

### Confirmado

**Hay envíos redundantes.** 75 updates/s contra 58.8 FPS: ~25% de los envíos corresponden a frames
que ya recibieron uno. Con la escala corregida se ve el mecanismo — grupos de ~6 barras parejas de
~15-16 ms puntuados por **una barra corta de 3-5 ms**. La cuenta cierra en ~60 updates regulares
(uno por frame) más ~15 intercalados.

Eso implica **más de una escritura al store por frame**, cada una disparando un reenvío completo
de uniforms. Es la propiedad 2 de la hipótesis, verificada. Durante un crossfade se duplica
(propiedad 3, no medida pero deducible del código).

**El jitter viene de adelantos, no de retrasos.** Es la corrección más importante sobre la lectura
inicial: el σ de 5.8 ms no son entregas tarde, son entregas de más llegando temprano.

### Descartado

**No es un problema de tamaño de mensaje.** Con `Synthetic Payload Size` en 0 el jitter ya es el
42% de la media. No hizo falta subir la perilla: la opción de adelgazar el payload queda fuera.

### No confirmado

**Que la cadencia de datos sea la causa de los tirones.** El canal de datos **no tiene stalls**:
ninguna barra superó el umbral ni a 120 ms ni bajándolo a 30 ms. Si los tirones vinieran de cortes
en la entrega, tendrían que haber aparecido acá.

Un update de más no produce un salto visible; produce un frame que ignora un valor intermedio. Es
desperdicio de CPU y de structured clone, pero no es —por sí solo— una explicación del síntoma.

### Límite del instrumento

La medición dejó en evidencia un problema de diseño de la sonda: **no puede observar el canal de
datos mientras corre el renderer que causa el problema**, porque `diagnostic-fps` ocupa el slot del
renderer. Lo medido es la cadencia con un canvas2d liviano activo; los renderers reales compiten
por el main thread y pueden agregar jitter propio que acá es invisible.

Resolverlo requiere mover la instrumentación al host y dejar que la sonda sólo la dibuje. Es un
cambio de diseño, no un ajuste.

## Pregunta abierta que decide el próximo paso

**¿Los tirones aparecen con todos los renderers o con uno solo?** No se puede inferir del código y
condiciona toda la investigación:

- **Con todos** → el problema es del pipeline. Corresponde mover la instrumentación al host para
  medir sin ocupar el slot, y recién ahí decidir sobre las opciones de abajo.
- **Con uno solo** → el problema es del loop de ese worker, no del pipeline. La investigación se
  muda al renderer y este documento queda como hallazgo lateral.

## Opciones de arreglo (sin decidir)

Siguen abiertas porque atacan el desperdicio confirmado, que es real aunque no sea la causa del
síntoma.

| Opción | Qué hace | Costo / riesgo |
|---|---|---|
| **Dedupe de uniforms** | Reenviar sólo lo que cambió, con el patrón ya prototipado en `diagnosticConfigCache` ([:54](../../src/components/renderers/pipeline/GraphicsPipelineHost.tsx#L54)) | Barato y localizado. No arregla la irregularidad si los valores *sí* cambian seguido |
| **Colgar `syncUniforms` del rAF** | Desuscribir del store; leer el estado una vez por frame | Ataca las dos cosas: elimina los envíos redundantes (75 → 60) y regulariza por construcción. Cambia el timing de todos los renderers; puede atrasar un frame la respuesta a input |
| ~~Adelgazar el payload~~ | — | **DESCARTADA** por la medición: el jitter ya está presente con payload en 0 |

El dedupe está aplicado **sólo a `diagnostic-fps`** a propósito: generalizarlo toca el camino de
render de todos los renderers y merece medirse antes y después con esta misma sonda.

## Estado de las piezas

| Pieza | Estado | Evidencia |
|---|---|---|
| Sonda de cadencia | IMPLEMENTADO | `core-renderers/src/renderers/diagnostic-fps/` |
| Dedupe de uniforms de config | PARCIAL | [:281-288](../../src/components/renderers/pipeline/GraphicsPipelineHost.tsx#L281-L288) — sólo para `diagnostic-fps` |
| Medición de la cadencia | IMPLEMENTADO | Ver [Resultado](#resultado-de-la-medición) |
| Instrumentación en el host | PLANEADO | — |
| Arreglo de la cadencia | PLANEADO | — |

## Notas

**Trampa de relojes, ya corregida.** La sonda mostraba `Last heartbeat` en negativo (-290 ms)
porque comparaba el `performance.now()` del worker contra timestamps del main thread. El
`timeOrigin` de un worker dedicado arranca cuando se crea el worker, así que la resta medía ese
offset, no la antigüedad del dato. Corregido en `core-renderers@e2ac2ce` estampando la llegada con
el reloj del worker. Los deltas entre timestamps consecutivos del main thread nunca estuvieron
afectados —el offset se cancela—, así que el intervalo promedio y el jitter de arriba son válidos
incluso en las capturas previas al fix.

**`sequence` no es un contador.** El campo recibe `performance.now()`
([GraphicsPipelineHost.tsx:291](../../src/components/renderers/pipeline/GraphicsPipelineHost.tsx#L291)),
así que el `seq` en pantalla duplica a `timestampMs` en vez de contar mensajes. Si se quiere
detectar pérdidas de mensajes hay que hacerlo un contador real.

**`diagnostic-fps` queda visible en el selector de renderers, sin gate.** Es una decisión
consciente mientras dure la investigación; si el renderer sobrevive a la investigación, revisar
contra [la decisión de flag de desarrollo de renderers](../../../docs/decisiones/2026-08-06-flag-desarrollo-renderers.md).
