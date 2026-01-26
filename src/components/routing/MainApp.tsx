import React, { useRef } from 'react';
import { useTextureStore } from '../../store';
import ControlPanel from '../controls/ControlPanel';
import { renderers } from '../renderers';
import { ConsoleIcon } from '../shared/icons';
import MidiConsole from '../midi/MidiConsole';
import Sequencer from '../sequencer/Sequencer';
import DebugOverlay from '../debug/DebugOverlay';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import DualScreenManager from '../dualscreen/DualScreenManager';
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

export const MainApp: React.FC = () => {
  const { t } = useTranslation();
  const { state: layoutState, actions: layoutActions } = useAppLayout();
  
  // Hooks
  const { isFullscreen, isOverlayVisible, toggleFullscreen } = useFullscreenLayout();
  const { drawers, actions: drawerActions } = useDrawerStates();
  const { handleResetToDefault } = useAppEventHandlers();
  
  const appRef = useRef<HTMLDivElement>(null);

  // Get necessary state and actions from the store
  const midiLog = useTextureStore(state => state.midiLog);
  const clearMidiLog = useTextureStore(state => state.clearMidiLog);
  const rendererId = useTextureStore(state => state.project?.globalSettings.renderer ?? 'webgl');
  const dualScreenEnabled = useTextureStore(state => state.dualScreen.enabled);

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
  const CanvasComponent = renderers[rendererId]?.component;

  const viewportSection = (
    <MainViewport
      viewportMode={layoutState.viewport.mode}
      onModeChange={layoutActions.setViewportMode}
      CanvasComponent={CanvasComponent}
      dualScreenEnabled={dualScreenEnabled}
    />
  );

  return (
    <DualScreenManager>
      <div ref={appRef} className="bg-gray-900">
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
            {CanvasComponent && <CanvasComponent className="w-full h-full" />}
          </FullscreenLayout>
        )}
        
        <MidiConsole
          isOpen={drawers.isConsoleOpen}
          onClose={() => drawerActions.setIsConsoleOpen(false)}
          log={midiLog}
          onClear={clearMidiLog}
        />
        
        {!drawers.isConsoleOpen && !isFullscreen && (
          <button
            onClick={drawerActions.toggleConsole}
            className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-cyan-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
            aria-label={t('ui.openMidiConsole')}
          >
            <ConsoleIcon className="w-6 h-6" />
          </button>
        )}
        
        {/* Debug Overlay - Only visible when VITE_DEBUG_MODE=true */}
        {env.debugMode && <DebugOverlay />}
      </div>
    </DualScreenManager>
  );
};
