import { StateCreator } from 'zustand';

export interface DualScreenConfig {
  channel: string;
  enabled: boolean;
  isSecondaryWindow: boolean;
  syncPatterns?: string[]; // Patrones de keys para sincronizar (ej: ["currentSettings.*", "project.*"])
}

export interface DualScreenSlice {
  dualScreen: {
    config: DualScreenConfig;
    secondaryWindow: Window | null;
    broadcastChannel: BroadcastChannel | null;
  };
  openSecondaryWindow: () => void;
  closeSecondaryWindow: () => void;
  enableDualScreen: () => void;
  disableDualScreen: () => void;
}

// Middleware que maneja la sincronización entre ventanas
export const dualScreenMiddleware = <T extends object>(
  config: DualScreenConfig
) => {
  return (stateCreator: StateCreator<T>) => {
    return (set: any, get: any, api: any) => {
      const state = stateCreator(set, get, api);
      
      if (!config.enabled || typeof window === 'undefined') {
        return state;
      }

      let broadcastChannel: BroadcastChannel | null = null;
      
      try {
        // Crear canal de comunicación
        broadcastChannel = new BroadcastChannel(config.channel);
        
        // Escuchar mensajes de otras ventanas
        broadcastChannel.addEventListener('message', (event) => {
          const { type, payload } = event.data;
          
          if (type === 'STATE_SYNC' && !config.isSecondaryWindow) {
            // Solo la ventana principal recibe actualizaciones de estado
            return;
          }
          
          if (type === 'STATE_UPDATE') {
            // Aplicar cambios sin disparar nuevos eventos de sincronización
            set(payload, false, 'dual-screen-sync');
          }
        });
        
        // Sobrescribir el set para interceptar cambios y sincronizarlos
        const originalSet = set;
        const syncSet = (updater: any, replace?: boolean, action?: string) => {
          // Evitar bucles de sincronización
          if (action === 'dual-screen-sync') {
            return originalSet(updater, replace, action);
          }
          
          const result = originalSet(updater, replace, action);
          
          // Sincronizar solo si está habilitado y no es una ventana secundaria
          if (broadcastChannel && !config.isSecondaryWindow) {
            const currentState = get();
            const filteredState = filterStateForSync(currentState, config.syncPatterns);
            
            broadcastChannel.postMessage({
              type: 'STATE_UPDATE',
              payload: filteredState,
              timestamp: Date.now()
            });
          }
          
          return result;
        };
        
        return { ...state, set: syncSet };
      } catch (error) {
        console.warn('BroadcastChannel no soportado:', error);
        return state;
      }
    };
  };
};

// Función auxiliar para filtrar qué partes del estado sincronizar
function filterStateForSync(state: any, patterns?: string[]): any {
  if (!patterns || patterns.length === 0) {
    // Por defecto, sincronizar solo las propiedades relevantes para el render
    return {
      currentSettings: state.currentSettings,
      project: state.project,
      activeSequenceIndex: state.activeSequenceIndex,
      textureRotation: state.textureRotation,
      transitionProgress: state.transitionProgress,
      previousGradient: state.previousGradient,
      previousBackgroundGradient: state.previousBackgroundGradient,
      sequencerCurrentStep: state.sequencerCurrentStep,
      activeAnimations: state.activeAnimations ? 
        Object.fromEntries(state.activeAnimations) : null
    };
  }
  
  // Implementar filtrado por patrones si se especifican
  const filtered: any = {};
  patterns.forEach(pattern => {
    if (pattern.includes('*')) {
      const baseKey = pattern.replace('.*', '');
      if (state[baseKey]) {
        filtered[baseKey] = state[baseKey];
      }
    } else {
      if (state[pattern]) {
        filtered[pattern] = state[pattern];
      }
    }
  });
  
  return filtered;
}

export default dualScreenMiddleware;