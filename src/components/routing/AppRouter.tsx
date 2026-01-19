import React, { useEffect } from 'react';
import { useTextureStore } from '../../store';
import DualScreenManager from '../dualscreen/DualScreenManager';
import SecondaryDisplay from '../dualscreen/SecondaryDisplay';
import { MainApp } from './MainApp';
import { AppLayoutProvider } from '../../contexts/AppLayoutContext';
import type { Project } from '../../types';

interface AppRouterProps {
  initialProject: Project;
}

export const AppRouter: React.FC<AppRouterProps> = ({ initialProject }) => {
  // Initialize the store with the project data loaded from localStorage or default file.
  useEffect(() => {
    useTextureStore.getState().initializeProject(initialProject);
  }, [initialProject]);

  // Detectar si esta es una ventana secundaria
  const urlParams = new URLSearchParams(window.location.search);
  const isSecondaryWindow = urlParams.get('display') === 'secondary';
  
  // Si es ventana secundaria, mostrar solo el display
  if (isSecondaryWindow) {
    return (
      <DualScreenManager>
        <SecondaryDisplay />
      </DualScreenManager>
    );
  }

  // Ventana principal con context provider
  return (
    <AppLayoutProvider>
      <MainApp />
    </AppLayoutProvider>
  );
};
