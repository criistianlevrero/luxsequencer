# App.tsx Refactoring - Separation of Concerns

## Current State Analysis

El archivo `App.tsx` ha crecido considerablemente desde su versión inicial y ahora maneja múltiples responsabilidades:

- **Layout Management**: Fullscreen, drawer states, overlay visibility
- **Route Detection**: Secondary window detection
- **State Management**: Multiple UI states (drawers, console, fullscreen)
- **Event Handling**: Mouse events, fullscreen changes, keyboard shortcuts
- **Rendering Logic**: Conditional rendering based on viewport modes
- **Component Orchestration**: Managing multiple panels and overlays

**Líneas de código**: ~280+ líneas en un solo componente
**Responsabilidades**: 6+ diferentes concerns mezclados

## Proposed Refactoring Strategy

### 1. Layout Hooks Pattern

**Problema**: Lógica de layout dispersa en el componente principal.

**Solución**: Extraer hooks personalizados para manejar estados de UI específicos.

```typescript
// hooks/useFullscreenLayout.ts
export const useFullscreenLayout = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const overlayTimeoutRef = useRef<number | null>(null);
  
  // Toda la lógica de fullscreen, mouse events, etc.
  return {
    isFullscreen,
    isOverlayVisible,
    toggleFullscreen,
    handleMouseMove
  };
};

// hooks/useDrawerStates.ts
export const useDrawerStates = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSequencerDrawerOpen, setIsSequencerDrawerOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  
  return {
    drawers: { isDrawerOpen, isSequencerDrawerOpen, isConsoleOpen },
    actions: { setIsDrawerOpen, setIsSequencerDrawerOpen, setIsConsoleOpen }
  };
};
```

### 2. Layout Components Extraction

**Problema**: JSX complejo mezclado con lógica de negocio.

**Solución**: Extraer componentes de layout específicos.

```typescript
// components/layout/AppHeader.tsx
export const AppHeader: React.FC<{
  onFullscreen: () => void;
  onReset: () => void;
}> = ({ onFullscreen, onReset }) => {
  // Header específico con sus propios handlers
};

// components/layout/FullscreenLayout.tsx
export const FullscreenLayout: React.FC<{
  isOverlayVisible: boolean;
  drawers: DrawerStates;
  onDrawerToggle: (drawer: string) => void;
  children: React.ReactNode;
}> = ({ isOverlayVisible, drawers, onDrawerToggle, children }) => {
  // Layout específico para fullscreen
};

// components/layout/DesktopLayout.tsx
export const DesktopLayout: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Layout específico para desktop
};
```

### 3. Route Management Component

**Problema**: Detección de ventana secundaria en App.tsx.

**Solución**: Componente de routing dedicado.

```typescript
// components/routing/AppRouter.tsx
export const AppRouter: React.FC<{ initialProject: Project }> = ({ initialProject }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const isSecondaryWindow = urlParams.get('display') === 'secondary';
  
  if (isSecondaryWindow) {
    return (
      <DualScreenManager>
        <SecondaryDisplay />
      </DualScreenManager>
    );
  }
  
  return <MainApp initialProject={initialProject} />;
};
```

### 4. App State Context

**Problema**: Estado UI disperso en múltiples useState.

**Solución**: Context provider para estado de aplicación.

```typescript
// contexts/AppLayoutContext.tsx
interface AppLayoutState {
  drawers: {
    control: boolean;
    sequencer: boolean;
    console: boolean;
  };
  fullscreen: {
    isActive: boolean;
    overlayVisible: boolean;
  };
  viewport: {
    mode: ViewportMode;
  };
}

export const AppLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appLayoutReducer, initialState);
  
  return (
    <AppLayoutContext.Provider value={{ state, dispatch }}>
      {children}
    </AppLayoutContext.Provider>
  );
};
```

### 5. Event Handler Abstraction

**Problema**: Event handlers mezclados con componente principal.

**Solución**: Custom hooks para event handling específico.

```typescript
// hooks/useKeyboardShortcuts.ts
export const useKeyboardShortcuts = (actions: ShortcutActions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') actions.toggleFullscreen();
      if (e.key === 'Escape' && e.ctrlKey) actions.closeAllDrawers();
      // etc.
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
};

// hooks/useAppEventHandlers.ts
export const useAppEventHandlers = () => {
  const { t } = useTranslation();
  const resetToDefault = useTextureStore(state => state.resetToDefault);
  
  const handleResetToDefault = useCallback(() => {
    const confirmReset = window.confirm(t('error.resetConfirmation'));
    if (confirmReset) resetToDefault();
  }, [resetToDefault, t]);
  
  return { handleResetToDefault };
};
```

## Proposed File Structure

```
src/
├── App.tsx                     # 50-80 líneas máximo
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── DesktopLayout.tsx
│   │   ├── FullscreenLayout.tsx
│   │   ├── DrawerOverlay.tsx
│   │   └── MainViewport.tsx
│   ├── routing/
│   │   └── AppRouter.tsx
│   └── ...existing
├── contexts/
│   └── AppLayoutContext.tsx
├── hooks/
│   ├── useFullscreenLayout.ts
│   ├── useDrawerStates.ts
│   ├── useKeyboardShortcuts.ts
│   └── useAppEventHandlers.ts
└── ...existing
```

## Implementation Phases

### Phase 1: Hook Extraction (Low Risk)
- ✅ Extraer `useFullscreenLayout`
- ✅ Extraer `useDrawerStates` 
- ✅ Extraer `useAppEventHandlers`
- ✅ Testing: Comportamiento idéntico

### Phase 2: Layout Components (Medium Risk)
- ✅ Crear `AppHeader` component
- ✅ Crear `DesktopLayout` component
- ✅ Crear `FullscreenLayout` component
- ✅ Crear `MainViewport` component
- ✅ Testing: UI idéntica, responsive funcional

### Phase 3: Route Management Separation (Medium Risk)
- ✅ Extraer `AppRouter` component
- ✅ Crear `MainApp` component  
- ✅ Mover lógica de secondary window
- ✅ Testing: Dual screen funcional

### Phase 4: Context Integration (High Risk)
- ✅ Implementar `AppLayoutContext`
- ✅ Migrar estado a context con useReducer
- ✅ Integrar keyboard shortcuts (`useKeyboardShortcuts`)
- ✅ Refactorizar hooks para usar context
- ✅ Testing: Estado persistente, performance check

## Keyboard Shortcuts Added

### Fullscreen Mode Shortcuts
- **F11**: Toggle fullscreen mode
- **Escape**: Close all drawers (in fullscreen)
- **Ctrl+1**: Toggle control panel drawer
- **Ctrl+2**: Toggle sequencer drawer
- **Ctrl+`**: Toggle MIDI console

### Implementation Details
- Shortcuts work globally when MainApp is mounted
- F11 preventDefault to avoid browser conflicts
- Context-based state management ensures consistent behavior
- All shortcuts respect fullscreen/desktop mode contexts

## Benefits Expected

### Code Quality
- **Reducción de líneas**: App.tsx de 280+ a ~80 líneas
- **Single Responsibility**: Cada componente/hook con propósito específico
- **Testability**: Hooks y componentes aislados más fáciles de testear
- **Reusability**: Hooks reutilizables en otros contextos

### Developer Experience
- **Navegabilidad**: Más fácil encontrar funcionalidad específica
- **Debugging**: Stack traces más claros
- **Mantenimiento**: Cambios aislados sin side effects
- **Onboarding**: Estructura más comprensible para nuevos desarrolladores

### Performance
- **Bundle splitting**: Posibilidad de lazy loading de layouts
- **Re-render optimization**: Context providers específicos
- **Memory management**: Cleanup más granular de event listeners

## Implementation Considerations

### Backward Compatibility
- Mantener misma interfaz pública durante transición
- Feature flags para testing de nuevas implementaciones
- Rollback plan en cada phase

### Testing Strategy
- Unit tests para cada hook extraído
- Integration tests para layouts
- E2E tests para flujos críticos (fullscreen, dual screen)
- Performance benchmarks pre/post refactoring

### Migration Path
- Refactoring incremental sin breaking changes
- Mantener funcionalidad existente durante desarrollo
- Code review exhaustivo en cada phase
- Documentation actualizada en paralelo

## Priority Assessment

**High Priority** (Performance & Maintainability Impact):
1. Hook extraction (useFullscreenLayout, useDrawerStates)
2. AppHeader component extraction
3. Event handler abstraction

**Medium Priority** (Code Organization):
4. Layout component extraction
5. Route management separation

**Low Priority** (Architecture Improvement):
6. Context provider implementation
7. Advanced keyboard shortcuts
8. Bundle splitting optimization

## Success Metrics

- **Code Complexity**: Reducir cyclomatic complexity de App.tsx
- **Bundle Size**: Mantener o reducir tamaño final
- **Performance**: Mantener 60fps en fullscreen mode
- **Developer Velocity**: Tiempo de implementación de nuevas features UI
- **Bug Reduction**: Menos bugs relacionados con estado UI

---

*Esta refactorización debe ser implementada gradualmente, con testing exhaustivo en cada fase y rollback plan disponible.*
