import React from 'react';
import ViewportControls from '../controls/ViewportControls';
import { RendererErrorBoundary } from '../error/RendererErrorBoundary';
import type { ViewportMode } from '../../store/types';

interface MainViewportProps {
  viewportMode: ViewportMode;
  onModeChange: (mode: ViewportMode) => void;
  CanvasComponent?: React.FC<{ className?: string }>;
  dualScreenEnabled: boolean;
}

export const MainViewport: React.FC<MainViewportProps> = ({
  viewportMode,
  onModeChange,
  CanvasComponent,
  dualScreenEnabled
}) => {
  return (
    <div className="relative bg-gray-800/50 p-3 rounded-xl shadow-2xl border border-gray-700">
      <ViewportControls mode={viewportMode} onModeChange={onModeChange} />
      <div className={
        viewportMode === 'horizontal'
          ? "w-full aspect-video overflow-hidden rounded-xl bg-gray-800"
          : "w-full max-w-sm mx-auto aspect-[9/16] overflow-hidden rounded-xl bg-gray-800"
      }>
        {CanvasComponent && !dualScreenEnabled ? (
          <RendererErrorBoundary renderer={CanvasComponent.displayName || 'unknown'}>
            <CanvasComponent className="w-full h-full" />
          </RendererErrorBoundary>
        ) : dualScreenEnabled ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-900/50">
            <div className="text-center space-y-3">
              <div className="text-2xl text-cyan-400">📺</div>
              <div className="text-lg font-medium">Dual Screen Activo</div>
              <div className="text-sm opacity-75">
                El render se está mostrando en la pantalla secundaria
              </div>
              <div className="text-xs opacity-50">
                Preview deshabilitado para optimizar performance
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
              Error: Renderer no encontrado.
          </div>
        )}
      </div>
    </div>
  );
};
