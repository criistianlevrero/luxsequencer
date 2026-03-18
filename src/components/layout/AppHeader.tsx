import React from 'react';
import { FishIcon, EnterFullscreenIcon, ResetIcon } from '../ui/icons';
import { IconActionButton } from '../ui';
import { LanguageSelector } from '../i18n/LanguageSelector';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import packageJson from '../../../package.json';

interface AppHeaderProps {
  onFullscreen: () => void;
  onReset: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onFullscreen, onReset }) => {
  const { t } = useTranslation();

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FishIcon className="h-6 w-6 text-cyan-400" />
              <h1 className="text-base md:text-lg font-bold text-gray-50">
                LuxSequencer - generative visuals in real time ({packageJson.version})
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="header" />
            <IconActionButton
              icon={<ResetIcon className="w-5 h-5" />}
              onClick={onReset}
              title={t('ui.resetToDefault')}
            />
            <IconActionButton
              icon={<EnterFullscreenIcon className="w-6 h-6" />}
              onClick={onFullscreen}
              aria-label={t('ui.enterFullscreen')}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
