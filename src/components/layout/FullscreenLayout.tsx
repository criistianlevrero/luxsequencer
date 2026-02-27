import React from 'react';
import { ExitFullscreenIcon, SettingsIcon, CloseIcon, SequencerIcon, ResetIcon } from '../ui/icons';
import { Button } from '../ui';
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
          <Button
            variant="ghost"
            size="icon"
            icon={drawers.isDrawerOpen ? <CloseIcon className="w-6 h-6"/> : <SettingsIcon className="w-6 h-6" />}
            iconOnly
            onClick={drawerActions.toggleDrawer}
            aria-label={drawers.isDrawerOpen ? t('ui.closeControls') : t('ui.openControls')}
            className="rounded-full p-3 bg-gray-800/70 text-white backdrop-blur-sm hover:bg-gray-700/90"
          />
          <Button
            variant="ghost"
            size="icon"
            icon={drawers.isSequencerDrawerOpen ? <CloseIcon className="w-6 h-6"/> : <SequencerIcon className="w-6 h-6" />}
            iconOnly
            onClick={drawerActions.toggleSequencerDrawer}
            aria-label={drawers.isSequencerDrawerOpen ? t('ui.closeSequencer') : t('ui.openSequencer')}
            className="rounded-full p-3 bg-gray-800/70 text-white backdrop-blur-sm hover:bg-gray-700/90"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            icon={<ResetIcon className="w-6 h-6" />}
            iconOnly
            onClick={onReset}
            title={t('ui.resetToDefault')}
            className="rounded-full p-3 bg-gray-800/70 text-white backdrop-blur-sm hover:bg-gray-700/90"
          />
          <Button
            variant="ghost"
            size="icon"
            icon={<ExitFullscreenIcon className="w-6 h-6" />}
            iconOnly
            onClick={onFullscreen}
            aria-label={t('ui.exitFullscreen')}
            className="rounded-full p-3 bg-gray-800/70 text-white backdrop-blur-sm hover:bg-gray-700/90"
          />
        </div>
      </div>
       
      {/* Left Control Drawer */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800/90 backdrop-blur-sm border-r border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out z-40 w-full max-w-md ${
          drawers.isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 overflow-y-auto h-full text-gray-200">
          {controlPanel}
        </div>
      </div>

      {/* Bottom Sequencer Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out z-40 ${
          drawers.isSequencerDrawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-4 text-gray-200 container mx-auto">
          {sequencerPanel}
        </div>
      </div>
    </div>
  );
};
