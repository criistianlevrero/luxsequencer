
import React from 'react';
import { MidiIcon } from '../../icons';

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
    learnTitle = "Aprender mapeo MIDI",
    clearTitle = "Limpiar mapeo MIDI"
}) => {
    const baseClasses = "w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500";
    const stateClasses = isLearning
        ? "bg-orange-500 text-white animate-midi-learn-pulse"
        : isMapped
        ? "bg-cyan-600 text-white"
        : "bg-gray-600 hover:bg-gray-500 text-gray-300";

    const defaultTitle = isMapped ? clearTitle : learnTitle;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`${baseClasses} ${stateClasses}`}
            title={title || defaultTitle}
            aria-label={title || defaultTitle}
        >
            <MidiIcon className="w-5 h-5" />
        </button>
    );
};

export default MidiLearnButton;
