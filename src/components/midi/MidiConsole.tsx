
import React from 'react';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import { CloseIcon } from '../ui/icons';
import { Button, IconActionButton, Sheet } from '../ui';
import type { MidiLogEntry } from '../../types';

interface MidiConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  log: MidiLogEntry[];
  onClear: () => void;
}

const MidiConsole: React.FC<MidiConsoleProps> = ({ isOpen, onClose, log, onClear }) => {
  const { t } = useTranslation();
  
  return (
    <Sheet
      side="bottom"
      open={isOpen}
      style={{ maxHeight: '40vh' }}
      aria-hidden={!isOpen}
    >
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-3 border-b border-gray-600 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-100">{t('midi.console')}</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClear}
              aria-label={t('ui.clearConsole')}
              className="bg-gray-600 hover:bg-gray-500 text-gray-200"
            >
              {t('ui.clear')}
            </Button>
            <IconActionButton
              icon={<CloseIcon className="w-5 h-5" />}
              onClick={onClose}
              aria-label={t('ui.closeConsole')}
            />
          </div>
        </header>
        <div className="flex-grow p-4 overflow-y-auto font-mono text-sm">
          {log.length === 0 ? (
            <p className="text-gray-500">{t('midi.waiting')}</p>
          ) : (
            log.map((entry, index) => (
              <div key={index} className="flex items-baseline space-x-4 mb-1">
                <span className="text-gray-500">{entry.timeStamp.toString().padStart(8, ' ')}:</span>
                <p className="text-gray-300">
                  <span className="text-purple-400">[{entry.data.join(', ')}]</span>
                  <span className="ml-4 text-cyan-400">
                    Status: {entry.data[0]}, Controller: {entry.data[1]}, Value: {entry.data[2]}
                  </span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </Sheet>
  );
};

export default MidiConsole;
