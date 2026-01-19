import React from 'react';
import { FishIcon, EnterFullscreenIcon, ResetIcon } from '../shared/icons';
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
            <button
              onClick={onReset}
              className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
              title={t('ui.resetToDefault')}
            >
              <ResetIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onFullscreen}
              className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
              aria-label={t('ui.enterFullscreen')}
            >
              <EnterFullscreenIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
