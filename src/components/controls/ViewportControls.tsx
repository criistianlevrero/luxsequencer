
import React from 'react';
import { DesktopIcon, MobileIcon } from '../shared/icons';
import { useTranslation } from '../../i18n/hooks/useTranslation';

type ViewportMode = 'horizontal' | 'vertical';

interface ViewportControlsProps {
  mode: ViewportMode;
  onModeChange: (mode: ViewportMode) => void;
}

const ViewportControls: React.FC<ViewportControlsProps> = ({ mode, onModeChange }) => {
  const { t } = useTranslation();
  const buttonStyle = "p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500";
  const activeStyle = "bg-cyan-600 text-white";
  const inactiveStyle = "bg-gray-700/80 hover:bg-gray-600/80 text-gray-300";

  return (
    <div className="absolute top-3 right-3 z-10 bg-gray-800/80 backdrop-blur-sm p-1 rounded-lg flex items-center space-x-1">
      <button
        onClick={() => onModeChange('horizontal')}
        className={`${buttonStyle} ${mode === 'horizontal' ? activeStyle : inactiveStyle}`}
        aria-label={t('viewport.desktop')}
        title={t('viewport.desktop')}
      >
        <DesktopIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => onModeChange('vertical')}
        className={`${buttonStyle} ${mode === 'vertical' ? activeStyle : inactiveStyle}`}
        aria-label={t('viewport.mobile')}
        title={t('viewport.mobile')}
      >
        <MobileIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ViewportControls;
