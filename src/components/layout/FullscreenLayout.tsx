import React from 'react';
import { ExitFullscreenIcon, SettingsIcon, CloseIcon, SequencerIcon, ResetIcon } from '../ui/icons';
import { IconActionButton, Sheet } from '../ui';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import type { DrawerStates, DrawerActions } from '../../hooks/useDrawerStates';

interface FullscreenLayoutProps {
  isOverlayVisible: boolean;
  drawers: DrawerStates;
  drawerActions: DrawerActions;
  onFullscreen: () => void;
  onReset: () => void;
  children: React.ReactNode;
  controlPanel: React.ReactNode;
  sequencerPanel: React.ReactNode;
}

export const FullscreenLayout: React.FC<FullscreenLayoutProps> = ({
  isOverlayVisible,
  drawers,
  drawerActions,
  onFullscreen,
  onReset,
  children,
  controlPanel,
  sequencerPanel
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 w-full h-full">
      {children}
      
      {/* Top Overlay Controls */}
      <div
        className={`fixed top-4 left-4 right-4 flex justify-between items-center transition-opacity duration-300 z-50 ${
          isOverlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-2">
          <IconActionButton
            tone="overlay"
            icon={drawers.isDrawerOpen ? <CloseIcon className="w-6 h-6"/> : <SettingsIcon className="w-6 h-6" />}
            onClick={drawerActions.toggleDrawer}
            aria-label={drawers.isDrawerOpen ? t('ui.closeControls') : t('ui.openControls')}
          />
          <IconActionButton
            tone="overlay"
            icon={drawers.isSequencerDrawerOpen ? <CloseIcon className="w-6 h-6"/> : <SequencerIcon className="w-6 h-6" />}
            onClick={drawerActions.toggleSequencerDrawer}
            aria-label={drawers.isSequencerDrawerOpen ? t('ui.closeSequencer') : t('ui.openSequencer')}
          />
        </div>
        <div className="flex items-center space-x-2">
          <IconActionButton
            tone="overlay"
            icon={<ResetIcon className="w-6 h-6" />}
            onClick={onReset}
            title={t('ui.resetToDefault')}
          />
          <IconActionButton
            tone="overlay"
            icon={<ExitFullscreenIcon className="w-6 h-6" />}
            onClick={onFullscreen}
            aria-label={t('ui.exitFullscreen')}
          />
        </div>
      </div>
       
      {/* Left Control Drawer */}
      <Sheet side="left" open={drawers.isDrawerOpen} className="w-full max-w-md">
        <div className="p-4 overflow-y-auto h-full text-gray-200">
          {controlPanel}
        </div>
      </Sheet>

      {/* Bottom Sequencer Drawer */}
      <Sheet side="bottom" open={drawers.isSequencerDrawerOpen}>
        <div className="container mx-auto p-4 text-gray-200">
          {sequencerPanel}
        </div>
      </Sheet>
    </div>
  );
};
