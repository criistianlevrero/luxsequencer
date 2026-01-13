# Sistema de Doble Pantalla - LuxSequencer

## Resumen

Sistema que permite usar dos ventanas simultáneamente:
- **Ventana principal**: Controles e interfaz completa
- **Ventana secundaria**: Solo renderer para proyección (auto-fullscreen)

## Implementación

### Arquitectura

**BroadcastChannel API** para comunicación en tiempo real entre ventanas:
- Canal `luxsequencer-dualscreen` 
- Sincronización automática de estado
- Sin polling, eventos nativos del navegador

### Componentes

### Componentes

#### `DualScreenSlice` (Store)
```typescript
// Estado
enabled: boolean                    // Sistema activado
isSecondaryWindow: boolean         // Es ventana secundaria
secondaryWindow: Window | null     // Referencia a ventana secundaria
broadcastChannel: BroadcastChannel // Canal de comunicación

// Acciones principales
initializeDualScreen(isSecondary)  // Inicializa canal y listeners
openSecondaryWindow()              // Abre nueva ventana
broadcastStateUpdate(state)        // Sincroniza estado
```

#### `DualScreenManager.tsx`
- Detecta tipo de ventana por URL param `?display=secondary`
- Intercepta métodos de estado (`setCurrentSetting`, `loadPattern`, `setProject`)
- Sincronización automática durante animaciones activas
- Gestión de cleanup al desmontar

#### `SecondaryDisplay.tsx`
- Interface minimalista solo con renderer
- Auto-hide cursor tras 3s inactividad
- Soporte para viewport modes (desktop/mobile/default)
- Info overlay con estado actual

#### `DualScreenControls.tsx`
- Botón toggle en header principal
- Iconos: pantalla simple/dual según estado
- No se muestra en ventana secundaria

### Flujo de Sincronización

```
1. Principal: initializeDualScreen(false)
2. Secundaria: initializeDualScreen(true) + REQUEST_FULL_STATE
3. Principal: envía FULL_STATE_SYNC con estado completo
4. Durante uso: Principal intercepta cambios → STATE_UPDATE → Secundaria aplica
```

### Propiedades Sincronizadas

```typescript
{
  currentSettings,           // Controles de renderer
  textureRotation,          // Rotación continua
  transitionProgress,       // Progreso de transiciones
  previousGradient,         // Para shader crossfade
  previousBackgroundGradient,
  viewportMode,            // desktop/mobile/default
  sequencerCurrentStep,    // Paso activo del secuenciador
  selectedPatternId,       // Patrón seleccionado
  isPatternDirty          // Estado de modificación
}
```

## Uso

### Activación
1. Click botón doble pantalla en header (icono de pantallas)
2. Se abre ventana secundaria con `?display=secondary`  
3. Mover ventana a segunda pantalla
4. F11 para fullscreen

### Detección de Ventana

### Detección de Ventana
- Principal: `http://localhost:3000/`
- Secundaria: `http://localhost:3000/?display=secondary`
- Detección automática en `DualScreenManager` por URLSearchParams

### Características

**Ventana Principal**
- Interface completa con controles
- Intercepta y sincroniza todos los cambios
- Gestiona apertura/cierre de ventana secundaria
- Polling cada 1s para detectar cierre de secundaria

**Ventana Secundaria**  
- Solo renderer sin controles
- Solicita estado inicial al conectar
- Cursor auto-hide tras 3s
- Atajos: F11 (fullscreen), Ctrl+W (cerrar)
- Overlay con info de conexión

**Sincronización Inteligente**
- Solo durante animaciones activas (optimización)
- Delay de 5-10ms para evitar spam
- Intercepta métodos críticos transparentemente
- Suscripción reactiva a cambios de estado

## Ventajas

- **Cero latencia**: BroadcastChannel en tiempo real  
- **Plug & play**: Un click para activar
- **Optimizado**: Solo sincroniza durante animaciones
- **Robusto**: Detección automática de ventanas cerradas
- **Performance**: No duplica lógica, solo rendering

## Limitaciones

- Requiere navegadores modernos (BroadcastChannel)
- Same-origin only (mismo dominio)
- Popup blockers pueden interferir
- Sincronización puede tener ligero delay con animaciones complejas
