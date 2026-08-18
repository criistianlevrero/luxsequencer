> **Estado**: VIGENTE · **Fecha**: 2026-08-06 · **Última verificación**: 2026-08-12
> **Alcance**: `luxsequencer-core` + `core-renderers`
>
> Vivía en `docs/decisiones/2026-08-06-flag-desarrollo-renderers.md` de la raíz, marcado 🚚
> pendiente de mudanza porque este repo todavía no tenía carpeta `docs/decisiones/`. Movido acá
> el 2026-08-12, durante la auditoría de Fase 2.
>
> Su premisa se reverificó en esa sesión y **se confirmó**: ver
> [2026-08-12-fase-2-core.md](../auditoria/2026-08-12-fase-2-core.md) § 4.3 y riesgo C3.
>
> Si esta decisión cambia, se escribe un archivo nuevo que la supersede. **No se edita esta.**

# Flag de desarrollo de renderers: selección de origen, no desactivación de control

`luxsequencer-core` va a llamar a la API de cloud, con un flag para que un autor de renderers
trabaje sin cuenta en la nube. El flag es **imprescindible**, pero se diseña al revés de como
está hoy:

- ❌ **Mal**: el flag desactiva la validación de licencia. En una app open source, el flag *es*
  el bypass — cualquiera lo pone en `false` y buildea.
- ✅ **Bien**: el flag cambia **de dónde vienen** los renderers. En dev vienen del
  `core-renderers` local (que es lo que ya hace el proxy al 4174). Los renderers pagos
  simplemente no están disponibles: no hay chequeo que saltear porque el artefacto nunca llega.

Consecuencia: **`VITE_MARKETPLACE_ENFORCE_LICENSE_TOKENS` debe eliminarse.** Es un bypass del
tipo malo, y hoy además no hace nada porque `HARDCODED_EXTERNAL_RENDERERS` está vacío.

## Verificación del 2026-08-12

Las dos afirmaciones del último párrafo siguen siendo ciertas, y la segunda resultó ser más
amplia de lo que se creía al escribirla:

- `HARDCODED_EXTERNAL_RENDERERS` sigue siendo `[]`
  (`src/components/renderers/index.ts:265`), así que la rama que consulta
  `env.marketplaceEnforceLicenseTokens` (`:294`) es inalcanzable en toda ejecución real.
- El flag no está solo: hay **15 variables de entorno más** (`src/config.ts:26-45`) que
  configuran trust store, rotación de root keys y revocación, y que están gateadas por la misma
  condición `manifest.source === 'community'` que ningún paquete cumple.

Es decir: la decisión de eliminar `VITE_MARKETPLACE_ENFORCE_LICENSE_TOKENS` es correcta, pero
resolver sólo ese flag deja en pie el resto del aparato. La pregunta de fondo —si el marketplace
de terceros sigue siendo objetivo— quedó abierta como P1 de la auditoría de Fase 2.
