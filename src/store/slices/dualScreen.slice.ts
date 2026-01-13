import { StateCreator } from 'zustand';
import type { StoreState } from '../types';

export interface DualScreenState {
  dualScreen: {
    enabled: boolean;
    isSecondaryWindow: boolean;
    secondaryWindow: Window | null;
    broadcastChannel: BroadcastChannel | null;
    channelName: string;
  };
}

export interface DualScreenActions {
  openSecondaryWindow: () => void;
  closeSecondaryWindow: () => void;
  enableDualScreen: () => void;
  disableDualScreen: () => void;
  initializeDualScreen: (isSecondary: boolean) => void;
  broadcastStateUpdate: (partialState: any) => void;
}

export type DualScreenSlice = DualScreenState & DualScreenActions;

export const createDualScreenSlice: StateCreator<
  StoreState,
  [],
  [],
  DualScreenSlice
> = (set, get) => ({
  dualScreen: {
    enabled: false,
    isSecondaryWindow: false,
    secondaryWindow: null,
    broadcastChannel: null,
    channelName: 'luxsequencer-dualscreen'
  },

  initializeDualScreen: (isSecondary: boolean = false) => {
    if (typeof window === 'undefined') return;
    
    try {
      const channel = new BroadcastChannel('luxsequencer-dualscreen');
      
      // Configurar listener para recibir actualizaciones
      channel.addEventListener('message', (event) => {
        const { type, payload, source } = event.data;
        
        if (type === 'STATE_UPDATE') {
          // Aplicar cambios sin disparar broadcast para evitar bucles
          console.log('Applying state update with keys:', Object.keys(payload));
          set(payload, false);
        } else if (type === 'SECONDARY_WINDOW_CLOSED' && !isSecondary) {
          // La ventana secundaria se cerró, actualizar estado
          set(state => ({
            dualScreen: {
              ...state.dualScreen,
              secondaryWindow: null
            }
          }));
        } else if (type === 'REQUEST_FULL_STATE' && !isSecondary) {
          // Ventana secundaria solicita el estado completo
          const state = get();
          channel.postMessage({
            type: 'FULL_STATE_SYNC',
            payload: {
              currentSettings: state.currentSettings,
              project: state.project,
              activeSequenceIndex: state.activeSequenceIndex,
              textureRotation: state.textureRotation,
              transitionProgress: state.transitionProgress,
              previousGradient: state.previousGradient,
              previousBackgroundGradient: state.previousBackgroundGradient,
              sequencerCurrentStep: state.sequencerCurrentStep,
              viewportMode: state.viewportMode
            },
            timestamp: Date.now()
          });
        } else if (type === 'FULL_STATE_SYNC' && isSecondary) {
          // Recibir estado completo en ventana secundaria
          set(payload, false);
        }
      });

      set(state => ({
        dualScreen: {
          ...state.dualScreen,
          broadcastChannel: channel,
          isSecondaryWindow: isSecondary
        }
      }));

      // Si es ventana secundaria, solicitar el estado inicial
      if (isSecondary) {
        setTimeout(() => {
          channel.postMessage({
            type: 'REQUEST_FULL_STATE',
            timestamp: Date.now()
          });
        }, 100);
      }

    } catch (error) {
      console.warn('No se pudo inicializar BroadcastChannel:', error);
    }
  },

  enableDualScreen: () => {
    set(state => ({
      dualScreen: {
        ...state.dualScreen,
        enabled: true
      }
    }));
  },

  disableDualScreen: () => {
    const state = get();
    
    // Cerrar ventana secundaria si está abierta
    if (state.dualScreen.secondaryWindow) {
      state.dualScreen.secondaryWindow.close();
    }
    
    // Cerrar canal de comunicación
    if (state.dualScreen.broadcastChannel) {
      state.dualScreen.broadcastChannel.close();
    }
    
    set(state => ({
      dualScreen: {
        ...state.dualScreen,
        enabled: false,
        secondaryWindow: null,
        broadcastChannel: null
      }
    }));
  },

  openSecondaryWindow: () => {
    const state = get();
    
    if (state.dualScreen.secondaryWindow) {
      // Ya hay una ventana abierta, enfocarla
      state.dualScreen.secondaryWindow.focus();
      return;
    }

    // Obtener la URL actual para la ventana secundaria
    const baseUrl = window.location.origin + window.location.pathname;
    const secondaryUrl = `${baseUrl}?display=secondary`;
    
    // Configuración de la ventana secundaria
    const windowFeatures = [
      'width=1920',
      'height=1080',
      'toolbar=no',
      'menubar=no',
      'scrollbars=no',
      'resizable=yes',
      'status=no',
      'directories=no',
      'copyhistory=no'
    ].join(',');

    // Abrir ventana secundaria
    const secondaryWindow = window.open(secondaryUrl, 'LuxSequencer-Display', windowFeatures);
    
    if (!secondaryWindow) {
      alert('No se pudo abrir la ventana secundaria. Por favor, habilita las ventanas emergentes para este sitio.');
      return;
    }

    // Listener para detectar cuando se cierre la ventana secundaria
    const checkClosed = setInterval(() => {
      if (secondaryWindow.closed) {
        clearInterval(checkClosed);
        set(state => ({
          dualScreen: {
            ...state.dualScreen,
            secondaryWindow: null
          }
        }));
        
        // Notificar a otras ventanas que se cerró
        if (state.dualScreen.broadcastChannel) {
          state.dualScreen.broadcastChannel.postMessage({
            type: 'SECONDARY_WINDOW_CLOSED',
            timestamp: Date.now()
          });
        }
      }
    }, 1000);

    set(state => ({
      dualScreen: {
        ...state.dualScreen,
        secondaryWindow: secondaryWindow
      }
    }));
  },

  closeSecondaryWindow: () => {
    const state = get();
    
    if (state.dualScreen.secondaryWindow) {
      state.dualScreen.secondaryWindow.close();
      set(state => ({
        dualScreen: {
          ...state.dualScreen,
          secondaryWindow: null
        }
      }));
    }
  },

  broadcastStateUpdate: (partialState: any) => {
    const state = get();
    
    if (state.dualScreen.broadcastChannel && !state.dualScreen.isSecondaryWindow) {
      state.dualScreen.broadcastChannel.postMessage({
        type: 'STATE_UPDATE',
        payload: partialState,
        source: 'primary',
        timestamp: Date.now()
      });
    }
  }
});