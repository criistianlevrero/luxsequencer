import React from 'react';
import ViewportControls from '../controls/ViewportControls';
import { RendererErrorBoundary } from '../error/RendererErrorBoundary';
import { Card, EmptyState, ErrorState } from '../ui';
import type { ViewportMode } from '../../store/types';
import type { RendererDefinition } from '../renderers/types';

interface MainViewportProps {
  viewportMode: ViewportMode;
  onModeChange: (mode: ViewportMode) => void;
  CanvasComponent?: React.FC<{ className?: string }>;
  renderer?: RendererDefinition;
  dualScreenEnabled: boolean;
}

export const MainViewport: React.FC<MainViewportProps> = ({
  viewportMode,
  onModeChange,
  CanvasComponent,
  renderer,
  dualScreenEnabled
}) => {
  return (
    <Card tone="subtle" padding="sm" className="relative">
      <ViewportControls mode={viewportMode} onModeChange={onModeChange} />
      <div className={
        viewportMode === 'horizontal'
          ? "w-full aspect-video overflow-hidden rounded-xl bg-gray-800"
          : "w-full max-w-sm mx-auto aspect-9/16 overflow-hidden rounded-xl bg-gray-800"
      }>
        {CanvasComponent && !dualScreenEnabled ? (
          <RendererErrorBoundary renderer={renderer}>
            <CanvasComponent className="w-full h-full" />
          </RendererErrorBoundary>
        ) : dualScreenEnabled ? (
          <EmptyState
            icon="📺"
            heading="Dual Screen Activo"
            description="El render se está mostrando en la pantalla secundaria"
            hint="Preview deshabilitado para optimizar performance"
            className="bg-gray-900/50"
          />
        ) : (
          <ErrorState
            heading="Renderer no encontrado"
            description="No hay renderer disponible para este contexto"
            className="bg-gray-900/50"
          />
        )}
      </div>
    </Card>
  );
};
