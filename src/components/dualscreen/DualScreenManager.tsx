import React, { useEffect } from 'react';
import { useTextureStore } from '../../store';

interface DualScreenManagerProps {
  children: React.ReactNode;
}

export const DualScreenManager: React.FC<DualScreenManagerProps> = ({ children }) => {
  const initializeDualScreen = useTextureStore(state => state.initializeDualScreen);
  const broadcastStateUpdate = useTextureStore(state => state.broadcastStateUpdate);
  const isSecondaryWindow = useTextureStore(state => state.dualScreen?.isSecondaryWindow || false);

  useEffect(() => {
    // Detectar si esta es una ventana secundaria
    const urlParams = new URLSearchParams(window.location.search);
    const isSecondary = urlParams.get('display') === 'secondary';
    
    // Inicializar el sistema de dual screen
    initializeDualScreen(isSecondary);
    
    // Cleanup al desmontar
    return () => {
      if (!isSecondary) {
        useTextureStore.getState().disableDualScreen();
      }
    };
  }, [initializeDualScreen]);

  // Hook para interceptar cambios de estado y sincronizarlos (solo en ventana principal)
  useEffect(() => {
    if (isSecondaryWindow) return; // Solo la ventana principal sincroniza
    
    const store = useTextureStore.getState();
    
    // Sobrescribir setCurrentSetting para sincronización automática
    const originalSetCurrentSetting = store.setCurrentSetting;
    const originalLoadPattern = store.loadPattern;
    const originalSetProject = store.setProject;
    const originalRequestPropertyChange = store.requestPropertyChange;    
    // Suscripción para detectar cambios durante animaciones
    let lastCurrentSettings = store.currentSettings;
    let lastTransitionProgress = store.transitionProgress;
    let wasAnimating = store.activeAnimations.size > 0;
    
    const unsubscribe = useTextureStore.subscribe((state) => {
      const settingsChanged = state.currentSettings !== lastCurrentSettings;
      const transitionChanged = state.transitionProgress !== lastTransitionProgress;
      const isAnimating = state.activeAnimations.size > 0;
      const animationStatusChanged = isAnimating !== wasAnimating;
      
      // Solo hacer broadcast durante animaciones activas o cuando cambia algo relevante
      if (isAnimating && (settingsChanged || transitionChanged)) {
        setTimeout(() => {
          const newState = useTextureStore.getState();
          broadcastStateUpdate({
            currentSettings: newState.currentSettings,
            textureRotation: newState.textureRotation,
            transitionProgress: newState.transitionProgress,
            previousGradient: newState.previousGradient,
            previousBackgroundGradient: newState.previousBackgroundGradient,
            viewportMode: newState.viewportMode,
            selectedPatternId: newState.selectedPatternId,
            isPatternDirty: newState.isPatternDirty,
            sequencerCurrentStep: newState.sequencerCurrentStep
          });
        }, 5);
      }
      
      // También hacer broadcast cuando una animación inicia (para sincronizar estado inicial)
      if (animationStatusChanged && isAnimating) {
        setTimeout(() => {
          const newState = useTextureStore.getState();
          broadcastStateUpdate({
            currentSettings: newState.currentSettings,
            textureRotation: newState.textureRotation,
            transitionProgress: newState.transitionProgress,
            previousGradient: newState.previousGradient,
            previousBackgroundGradient: newState.previousBackgroundGradient,
            viewportMode: newState.viewportMode,
            selectedPatternId: newState.selectedPatternId,
            isPatternDirty: newState.isPatternDirty,
            sequencerCurrentStep: newState.sequencerCurrentStep
          });
        }, 5);
      }
      
      lastCurrentSettings = state.currentSettings;
      lastTransitionProgress = state.transitionProgress;
      wasAnimating = isAnimating;
    });    
    // Función helper para broadcast
    const doBroadcast = () => {
      setTimeout(() => {
        const newState = useTextureStore.getState();
        broadcastStateUpdate({
          currentSettings: newState.currentSettings,
          textureRotation: newState.textureRotation,
          transitionProgress: newState.transitionProgress,
          previousGradient: newState.previousGradient,
          previousBackgroundGradient: newState.previousBackgroundGradient,
          viewportMode: newState.viewportMode,
          selectedPatternId: newState.selectedPatternId,
          isPatternDirty: newState.isPatternDirty,
          sequencerCurrentStep: newState.sequencerCurrentStep
        });
      }, 10);
    };
    
    // Interceptar setCurrentSetting
    (store as any).setCurrentSetting = (key: string, value: any) => {
      originalSetCurrentSetting(key, value);
      doBroadcast();
    };
    
    // Interceptar loadPattern
    (store as any).loadPattern = (patternId: string, source?: any) => {
      originalLoadPattern(patternId, source);
      // La suscripción se encargará de sincronizar los cambios durante la animación
    };
    
    // Interceptar setProject (para cambios globales)
    (store as any).setProject = (projectUpdater: any) => {
      originalSetProject(projectUpdater);
      doBroadcast();
    };
    
    // Interceptar requestPropertyChange (usado por secuenciador y animaciones)
    (store as any).requestPropertyChange = (property: any, from: any, to: any, steps: number, source: any, interpolationType?: any) => {
      originalRequestPropertyChange(property, from, to, steps, source, interpolationType);
      // La suscripción se encargará de sincronizar los cambios (tanto inmediatos como animados)
    };
    
    // Cleanup al desmontar
    return () => {
      unsubscribe();
      (store as any).setCurrentSetting = originalSetCurrentSetting;
      (store as any).loadPattern = originalLoadPattern;
      (store as any).setProject = originalSetProject;
      (store as any).requestPropertyChange = originalRequestPropertyChange;
    };
  }, [isSecondaryWindow, broadcastStateUpdate]);

  return <>{children}</>;
};

export default DualScreenManager;