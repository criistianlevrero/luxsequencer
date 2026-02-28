import React, { useRef, useMemo } from 'react';
import { useTextureStore } from '../../store';
import ControlPanel from '../controls/ControlPanel';
import { renderers } from '../renderers';
import { ConsoleIcon } from '../ui/icons';
import { Button } from '../ui';
import MidiConsole from '../midi/MidiConsole';
import Sequencer from '../sequencer/Sequencer';
import DebugOverlay from '../debug/DebugOverlay';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import DualScreenManager from '../dualscreen/DualScreenManager';
import { RendererErrorBoundary } from '../error/RendererErrorBoundary';
import { env } from '../../config';
// Layout components
import { DesktopLayout } from '../layout/DesktopLayout';
import { FullscreenLayout } from '../layout/FullscreenLayout';
import { MainViewport } from '../layout/MainViewport';
// Context and hooks
import { useAppLayout } from '../../contexts/AppLayoutContext';
import { useFullscreenLayout } from '../../hooks/useFullscreenLayout';
import { useDrawerStates } from '../../hooks/useDrawerStates';
import { useAppEventHandlers } from '../../hooks/useAppEventHandlers';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useRendererHotReload as _useRendererHotReload } from '../../utils/hotReloadHooks';

export const MainApp: React.FC = () => {
  const { t } = useTranslation();
  const { state: layoutState, actions: layoutActions } = useAppLayout();
  
  // Hooks
  const { isFullscreen, isOverlayVisible, toggleFullscreen } = useFullscreenLayout();
  const { drawers, actions: drawerActions } = useDrawerStates();
  const { handleResetToDefault } = useAppEventHandlers();
  
  const appRef = useRef<HTMLDivElement>(null);

  // Get necessary state and actions from the store
  const project = useTextureStore(state => state.project);
  const midiLog = useTextureStore(state => state.midiLog);
  const clearMidiLog = useTextureStore(state => state.clearMidiLog);
  const rendererId = useTextureStore(state => state.project?.globalSettings.renderer ?? 'webgl');
  const dualScreenEnabled = useTextureStore(state => state.dualScreen.enabled);
  
  // Hot reload for renderers in development
  // const hotReload = useRendererHotReload(rendererId);

  const handleToggleFullscreen = () => toggleFullscreen(appRef);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    toggleFullscreen: handleToggleFullscreen,
    closeAllDrawers: drawerActions.closeAllDrawers,
    toggleControlDrawer: drawerActions.toggleDrawer,
    toggleSequencerDrawer: drawerActions.toggleSequencerDrawer,
    toggleConsole: drawerActions.toggleConsole,
    togglePlayStop: () => {
      const { project, setIsSequencerPlaying } = useTextureStore.getState();
      if (project) {
        setIsSequencerPlaying(!project.globalSettings.isSequencerPlaying);
      }
    },
  });

  // Prepare components
  const controlPanel = <ControlPanel />;
  const sequencerPanel = <Sequencer />;
  
  // Get current renderer with fallback handling
  const currentRenderer = useMemo(() => renderers[rendererId], [rendererId]);
  const CanvasComponent = currentRenderer?.component;

  const viewportSection = (
    <MainViewport
      viewportMode={layoutState.viewport.mode}
      onModeChange={layoutActions.setViewportMode}
      CanvasComponent={CanvasComponent}
      renderer={currentRenderer}
      dualScreenEnabled={dualScreenEnabled}
    />
  );

  return (
    <DualScreenManager>
      <div ref={appRef} className="bg-gray-900">
        {!project ? (
          <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-400">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p>Loading project...</p>
            </div>
          </div>
        ) : (
          <>
            {!isFullscreen ? (
              <DesktopLayout
                onFullscreen={handleToggleFullscreen}
                onReset={handleResetToDefault}
                controlPanel={controlPanel}
                viewportSection={viewportSection}
                sequencerPanel={sequencerPanel}
              />
            ) : (
              <FullscreenLayout
                isOverlayVisible={isOverlayVisible}
                drawers={drawers}
                drawerActions={drawerActions}
                onFullscreen={handleToggleFullscreen}
                onReset={handleResetToDefault}
                controlPanel={controlPanel}
                sequencerPanel={sequencerPanel}
              >
                <RendererErrorBoundary renderer={currentRenderer}>
                  {CanvasComponent ? (
                    <CanvasComponent className="w-full h-full" />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-800 text-gray-400">
                      <div className="text-center">
                        <h2 className="text-lg font-bold mb-2">Canvas Component Missing</h2>
                        <p className="text-sm">The renderer component could not be loaded</p>
                      </div>
                    </div>
                  )}
                </RendererErrorBoundary>
              </FullscreenLayout>
            )}
            
            <MidiConsole
              isOpen={drawers.isConsoleOpen}
              onClose={() => drawerActions.setIsConsoleOpen(false)}
              log={midiLog}
              onClear={clearMidiLog}
            />
            
            {!drawers.isConsoleOpen && !isFullscreen && (
              <Button
                variant="primary"
                size="fab"
                icon={<ConsoleIcon className="w-6 h-6" />}
                iconOnly
                onClick={drawerActions.toggleConsole}
                aria-label={t('ui.openMidiConsole')}
                className="fixed bottom-4 right-4 z-50 hover:bg-cyan-700"
              />
            )}
            
            {/* Debug Overlay - Only visible when VITE_DEBUG_MODE=true */}
            {env.debugMode && <DebugOverlay />}
            
            {/* Hot Reload Indicator */}
            {/* {hotReload.isReloading && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                🔄 Reloading {rendererId} renderer...
              </div>
            )} */}
          </>
        )}
      </div>
    </DualScreenManager>
  );
};
