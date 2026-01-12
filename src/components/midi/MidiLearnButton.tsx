
import React from 'react';
import { MidiIcon } from '../shared/icons';
import { Button } from '../shared/Button';
import { useTranslation } from '../../i18n/hooks/useTranslation';

interface MidiLearnButtonProps {
    isLearning: boolean;
    isMapped: boolean;
    onClick: () => void;
    title?: string;
    learnTitle?: string;
    clearTitle?: string;
}

const MidiLearnButton: React.FC<MidiLearnButtonProps> = ({ 
    isLearning, 
    isMapped, 
    onClick,
    title,
    learnTitle,
    clearTitle
}) => {
    const { t } = useTranslation();
    
    const stateClasses = isLearning
        ? "bg-orange-500 hover:bg-orange-600 text-white animate-midi-learn-pulse"
        : isMapped
        ? "bg-cyan-600 hover:bg-cyan-700 text-white"
        : "";

    const defaultTitle = isMapped 
        ? (clearTitle || t('midi.clearMappings')) 
        : (learnTitle || t('midi.learn'));

    return (
        <Button
            type="button"
            onClick={onClick}
            variant={isLearning || isMapped ? 'primary' : 'secondary'}
            size="icon"
            className={`w-10 h-10 flex-shrink-0 ${stateClasses}`}
            title={title || defaultTitle}
            aria-label={title || defaultTitle}
            icon={<MidiIcon className="w-5 h-5" />}
            iconOnly
        >
            {/* Icon only button */}
        </Button>
    );
};

export default MidiLearnButton;
