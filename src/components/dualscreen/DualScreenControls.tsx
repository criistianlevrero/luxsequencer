import React from 'react';
import { useTextureStore } from '../../store';

// Iconos para dual screen
export const DualScreenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="4" width="9" height="12" rx="1" />
    <rect x="13" y="4" width="9" height="12" rx="1" />
    <path d="M6 8h2" />
    <path d="M6 12h2" />
    <path d="M17 8h2" />
    <path d="M17 12h2" />
  </svg>
);

export const SingleScreenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4" y="4" width="16" height="12" rx="1" />
    <path d="M8 8h8" />
    <path d="M8 12h8" />
  </svg>
);

interface DualScreenControlsProps {
  className?: string;
}

export const DualScreenControls: React.FC<DualScreenControlsProps> = ({ className }) => {
  const dualScreen = useTextureStore(state => state.dualScreen);
  const openSecondaryWindow = useTextureStore(state => state.openSecondaryWindow);
  const closeSecondaryWindow = useTextureStore(state => state.closeSecondaryWindow);
  const enableDualScreen = useTextureStore(state => state.enableDualScreen);
  const disableDualScreen = useTextureStore(state => state.disableDualScreen);

  const hasSecondaryWindow = dualScreen.secondaryWindow !== null;
  const isSecondaryWindow = dualScreen.isSecondaryWindow;

  // No mostrar controles en la ventana secundaria
  if (isSecondaryWindow) {
    return null;
  }

  const handleToggleDualScreen = () => {
    if (hasSecondaryWindow) {
      closeSecondaryWindow();
      disableDualScreen();
    } else {
      enableDualScreen();
      openSecondaryWindow();
    }
  };

  return (
    <button
      onClick={handleToggleDualScreen}
      className={`
        p-2 text-gray-400 hover:text-white transition-colors duration-200
        ${hasSecondaryWindow ? 'text-cyan-400' : ''}
        ${className || ''}
      `}
      title={hasSecondaryWindow ? 'Cerrar pantalla secundaria' : 'Abrir pantalla secundaria'}
    >
      {hasSecondaryWindow ? (
        <DualScreenIcon className="w-5 h-5" />
      ) : (
        <SingleScreenIcon className="w-5 h-5" />
      )}
    </button>
  );
};

export default DualScreenControls;