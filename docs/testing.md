# Sistema de Testing (resumen rápido)

Esta guía está pensada para que **desarrolladores** y **agentes IA** puedan entender rápido cómo probar LuxSequencer y cómo agregar tests sin romper el flujo.

## Stack actual

- Runner: **Vitest**
- Entorno: **jsdom**
- UI testing: **@testing-library/react** + **@testing-library/jest-dom**
- Config principal: `vitest.config.ts`
- Setup global: `src/test/setup.ts`

## Comandos

- Ejecutar tests en modo watch:

```bash
npm run test
```

- Ejecutar una corrida única (útil para CI/local):

```bash
npm run test -- --run
```

- Coverage:

```bash
npm run test:coverage
```

- Validaciones recomendadas antes de merge:

```bash
npm run type-check
npm run build
```

## Estructura y alcance

- Patrón de archivos: `src/**/*.test.ts` y `src/**/*.test.tsx`
- Incluye tests de:
	- slices de store (`src/store/slices`)
	- utilidades puras (`src/utils`, `src/store/utils`)
	- hooks (`src/hooks`)
	- componentes críticos (`src/components/**`)

No se prioriza test visual/pixel-perfect de WebGL; se validan **contratos**, estado y comportamiento observable.

## Setup global disponible

En `src/test/setup.ts` ya se inicializa:

- `@testing-library/jest-dom/vitest`
- `window.matchMedia` mock
- `requestAnimationFrame` / `cancelAnimationFrame` fallback

Si un test necesita APIs de navegador extra (por ejemplo MIDI o BroadcastChannel), mockearlas en el propio test o helper dedicado.

## Convenciones para nuevos tests

1. Usar enfoque **AAA**: Arrange → Act → Assert.
2. Probar comportamiento público, no implementación interna.
3. Mantener fixtures mínimas y explícitas.
4. Evitar dependencia entre tests (cada test prepara su estado).
5. Limpiar spies/mocks en `beforeEach`/`afterEach`.

## Patrones recomendados

### 1) Utilidades puras

- Sin mocks si no hay efectos secundarios.
- Cubrir edge cases primero (vacíos, límites, wrap-around, inválidos).

### 2) Slices de store

- Crear harness local (`state` + `set` + `get` + acciones del slice).
- Mockear solo dependencias externas (localStorage, APIs Web, timers).
- Verificar transición de estado y llamadas esperadas.

### 3) Hooks/componentes

- Usar Testing Library (`render`, `renderHook`, `fireEvent`).
- Aserciones sobre UI y efectos visibles.
- Mockear store/i18n cuando aplique, manteniendo contratos reales.

## Checklist para agregar un test nuevo

- [ ] El nombre del test describe comportamiento (no implementación).
- [ ] Cubre un caso real o una regresión probable.
- [ ] Corre en local con `npm run test -- --run`.
- [ ] No introduce flakiness por timers/eventos asíncronos.
- [ ] Si agrega mocks globales, no rompe otros tests.

## Flujo sugerido para agentes IA

1. Identificar archivo y módulo objetivo.
2. Reutilizar patrón de test existente más cercano.
3. Añadir caso mínimo reproducible del bug/comportamiento.
4. Ejecutar tests del archivo afectado y luego suite completa.
5. Si falla por causas no relacionadas, reportarlo sin mezclar fixes fuera de scope.

---

Si querés, en la próxima iteración puedo convertir esta guía en una versión “plantilla” con snippets listos para copiar para cada tipo de test (utils, slice, hook, componente).
