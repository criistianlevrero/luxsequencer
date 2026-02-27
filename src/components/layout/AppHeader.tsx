import React from 'react';
import { FishIcon, EnterFullscreenIcon, ResetIcon } from '../ui/icons';
import { Button } from '../ui';
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
          <div className="flex items-center space-x-2">
            <LanguageSelector className="bg-gray-700/80 text-white rounded px-2 py-1 text-sm border border-gray-600 hover:bg-gray-600 transition-colors" />
            <Button
              variant="ghost"
              size="icon"
              icon={<ResetIcon className="w-5 h-5" />}
              iconOnly
              onClick={onReset}
              title={t('ui.resetToDefault')}
              className="rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
            />
            <Button
              variant="ghost"
              size="icon"
              icon={<EnterFullscreenIcon className="w-6 h-6" />}
              iconOnly
              onClick={onFullscreen}
              aria-label={t('ui.enterFullscreen')}
              className="rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
