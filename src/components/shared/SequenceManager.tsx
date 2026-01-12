import React, { useState } from 'react';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import { useTextureStore } from '../../store';
import { SaveIcon, TrashIcon, CopyIcon, PlusIcon } from './icons';
import { Button } from './Button';

const SequenceManager: React.FC = () => {
  const { t } = useTranslation();
  const project = useTextureStore(state => state.project);
  const activeSequenceIndex = useTextureStore(state => state.activeSequenceIndex);
  const setActiveSequenceIndex = useTextureStore(state => state.setActiveSequenceIndex);
  const saveNewSequence = useTextureStore(state => state.saveNewSequence);
  const deleteSequence = useTextureStore(state => state.deleteSequence);
  const duplicateSequence = useTextureStore(state => state.duplicateSequence);

  const [showNewSequenceInput, setShowNewSequenceInput] = useState(false);
  const [newSequenceName, setNewSequenceName] = useState('');
  const [showDuplicateInput, setShowDuplicateInput] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');

  if (!project) return null;

  const activeSequence = project.sequences[activeSequenceIndex];
  const canDelete = project.sequences.length > 1;

  const handleSaveNewSequence = () => {
    if (newSequenceName.trim()) {
      saveNewSequence(newSequenceName.trim());
      setNewSequenceName('');
      setShowNewSequenceInput(false);
    }
  };

  const handleDuplicateSequence = () => {
    if (duplicateName.trim() && activeSequence) {
      duplicateSequence(activeSequence.id, duplicateName.trim());
      setDuplicateName('');
      setShowDuplicateInput(false);
    }
  };

  const handleDeleteSequence = () => {
    if (activeSequence && canDelete) {
      const confirmDelete = window.confirm(
        t('sequence.confirmDelete', { name: activeSequence.name })
      );
      if (confirmDelete) {
        deleteSequence(activeSequence.id);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Sequence Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="sequence-select" className="text-sm font-medium text-gray-300">
          {t('sequence.label')}:
        </label>
        <select
          id="sequence-select"
          value={activeSequenceIndex}
          onChange={(e) => setActiveSequenceIndex(Number(e.target.value))}
          className="bg-gray-700 text-white text-sm rounded-md px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {project.sequences.map((seq, index) => (
            <option key={seq.id} value={index}>
              {seq.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowNewSequenceInput(!showNewSequenceInput)}
          title={t('sequence.new')}
          iconOnly
        >
          <PlusIcon className="w-4 h-4" />
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowDuplicateInput(!showDuplicateInput)}
          title={t('sequence.duplicate')}
          iconOnly
        >
          <CopyIcon className="w-4 h-4" />
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={handleDeleteSequence}
          disabled={!canDelete}
          title={canDelete ? t('sequence.delete') : t('sequence.cantDeleteLast')}
          iconOnly
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* New Sequence Input */}
      {showNewSequenceInput && (
        <div className="flex items-center gap-2 w-full mt-2">
          <input
            type="text"
            value={newSequenceName}
            onChange={(e) => setNewSequenceName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveNewSequence()}
            placeholder={t('sequence.newName')}
            className="flex-1 bg-gray-700 text-white text-sm rounded-md px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            autoFocus
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveNewSequence}
          >
            <SaveIcon className="w-4 h-4 mr-1" />
            {t('ui.save')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowNewSequenceInput(false);
              setNewSequenceName('');
            }}
          >
            {t('ui.cancel')}
          </Button>
        </div>
      )}

      {/* Duplicate Sequence Input */}
      {showDuplicateInput && (
        <div className="flex items-center gap-2 w-full mt-2">
          <input
            type="text"
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDuplicateSequence()}
            placeholder={`Copia de ${activeSequence.name}`}
            className="flex-1 bg-gray-700 text-white text-sm rounded-md px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            autoFocus
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleDuplicateSequence}
          >
            <CopyIcon className="w-4 h-4 mr-1" />
            {t('ui.duplicate')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowDuplicateInput(false);
              setDuplicateName('');
            }}
          >
            {t('ui.cancel')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SequenceManager;
