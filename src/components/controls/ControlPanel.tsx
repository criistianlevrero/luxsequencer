import React, { useRef } from 'react';
import { useTextureStore } from '../../store';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import { TrashIcon, DownloadIcon, UploadIcon } from '../shared/icons';
import { renderers } from '../renderers';
import MidiLearnButton from '../midi/MidiLearnButton';
import CollapsibleSection from '../shared/CollapsibleSection';
import RendererControls from '../renderers/shared/RendererControls';
import { Select } from '../shared/Select';

const ControlPanel: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Select state and actions from the store
  const {
    project,
    activeSequenceIndex,
    midiDevices,
    selectedMidiDevice,
    selectedPatternId,
    isPatternDirty,
    learningPatternMidiNote,
    midiConnectionError,
    renderer,
  } = useTextureStore((state: ReturnType<typeof useTextureStore.getState>) => ({
    project: state.project,
    activeSequenceIndex: state.activeSequenceIndex,
    midiDevices: state.midi.devices,
    selectedMidiDevice: state.midi.selectedDeviceId,
    selectedPatternId: state.selectedPatternId,
    isPatternDirty: state.isPatternDirty,
    learningPatternMidiNote: state.learningPatternMidiNote,
    midiConnectionError: state.midi.connectionError,
    renderer: state.project?.globalSettings.renderer ?? 'webgl',
  }));

  const {
    selectMidiDevice,
    connectMidi,
    saveCurrentPattern,
    overwriteSelectedPattern,
    loadPattern,
    deletePattern,
    startLearningPatternNote,
    clearPatternMidiAssignment,
    exportProject,
    importProject,
    clearMidiError,
    setRenderer,
  } = useTextureStore.getState();

  if (!project) return null;

  const activeSequence = project.sequences[activeSequenceIndex];
  if (!activeSequence) return null; 

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      importProject(file);
      event.target.value = ''; 
  };
  
  const rendererSchema = renderers[renderer]?.controlSchema;

  return (
    <div className="divide-y divide-gray-700">
        <CollapsibleSection title={t('project.renderEngine')} defaultOpen>
            <div className="space-y-3">
                <p className="text-sm text-gray-400">
                    {t('project.renderEngineDescription')}
                </p>
                <Select 
                    id="renderer"
                    value={renderer}
                    onChange={(value) => setRenderer(value as string)}
                    options={Object.values(renderers).map(r => ({
                      value: r.id,
                      label: r.name,
                      description: `Renderer: ${r.id}`
                    }))}
                    fullWidth
                />
            </div>
        </CollapsibleSection>

        <CollapsibleSection title={t('patterns.title')}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => saveCurrentPattern()}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        {t('patterns.saveAsNew')}
                    </button>
                    <button
                        onClick={overwriteSelectedPattern}
                        disabled={!selectedPatternId}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        title={!selectedPatternId ? t('patterns.overwriteTooltip') : t('patterns.overwriteSelectedTooltip')}
                    >
                        {t('patterns.overwrite')}
                    </button>
                </div>
                <div className="space-y-2 pt-2">
                    <h4 className="font-medium text-gray-400">{t('patterns.savedMemories')}</h4>
                    {activeSequence.patterns.length === 0 ? (
                        <p className="text-gray-500 text-sm">{t('patterns.noPatterns')}</p>
                    ) : (
                        activeSequence.patterns.map(pattern => (
                            <div key={pattern.id} className="flex items-center bg-gray-700/50 p-2 rounded-lg space-x-2">
                                <span
                                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-200 ${
                                        selectedPatternId === pattern.id 
                                            ? (isPatternDirty ? 'bg-orange-400 animate-midi-learn-pulse' : 'bg-cyan-400 shadow-[0_0_5px_theme(colors.cyan.400)]')
                                            : 'bg-gray-600'
                                    }`}
                                    aria-hidden="true"
                                />
                                <button onClick={() => loadPattern(pattern.id)} className="flex-grow text-left px-2 py-1 hover:bg-gray-600 rounded-md transition-colors">
                                    {pattern.name}
                                </button>
                                <span className="text-xs font-mono text-cyan-400 w-12 text-center">
                                    {pattern.midiNote !== undefined ? `N: ${pattern.midiNote}` : '-'}
                                </span>
                                <MidiLearnButton
                                    isLearning={learningPatternMidiNote === pattern.id}
                                    isMapped={pattern.midiNote !== undefined}
                                    onClick={() => pattern.midiNote === undefined ? startLearningPatternNote(pattern.id) : clearPatternMidiAssignment(pattern.id)}
                                    learnTitle={t('patterns.assignMidi', { name: pattern.name })}
                                    clearTitle={t('patterns.clearMidi', { name: pattern.name })}
                                />
                                <button onClick={() => deletePattern(pattern.id)} className="w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center bg-gray-600 hover:bg-red-500/80 text-gray-300 hover:text-white transition-colors" aria-label={t('common.delete') + ` ${pattern.name}`}>
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </CollapsibleSection>
        
        {rendererSchema && <RendererControls schema={rendererSchema} />}

        <CollapsibleSection title={t('project.globalConfiguration')}>
            <div className="space-y-4">
                <div>
                    <h4 className="font-medium text-gray-300">{t('midi.configuration')}</h4>
                    <p className="text-sm text-gray-400 mt-1 mb-3">
                        {t('midi.configurationDescription')}
                    </p>
                    {midiConnectionError ? (
                        <div className="mb-4 bg-red-900/60 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative text-sm" role="alert">
                            <strong className="font-bold block mb-2">{t('midi.connectionError')}</strong>
                            <p className="mt-1">{midiConnectionError}</p>
                             <div className="mt-4 flex items-center space-x-3">
                                <button
                                    onClick={connectMidi}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-3 rounded-md text-xs transition-colors"
                                >
                                    {t('midi.retry')}
                                </button>
                                 <button
                                    onClick={clearMidiError}
                                    className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-3 rounded-md text-xs transition-colors"
                                >
                                    {t('common.close')}
                                </button>
                            </div>
                        </div>
                    ) : midiDevices.length > 0 ? (
                        <div className="space-y-3">
                             <label htmlFor="midiDevice" className="font-medium text-gray-300">{t('midi.inputDevice')}</label>
                                <Select 
                                    id="midiDevice"
                                    value={selectedMidiDevice || ''}
                                    onChange={(value) => selectMidiDevice(value)}
                                    fullWidth
                                >
                                    <option value="">{t('midi.notConnected')}</option>
                                    {midiDevices.map(device => (
                                        <option key={device.id} value={device.id}>{device.name}</option>
                                    ))}
                                </Select>
                        </div>
                    ) : (
                        <button
                            onClick={connectMidi}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                        >
                            {t('midi.connect')}
                        </button>
                    )}
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-700">
                    <h4 className="font-medium text-gray-300">{t('project.dataManagement')}</h4>
                    <p className="text-sm text-gray-400 mt-1">
                        {t('project.dataManagementDescription')}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <button 
                            onClick={exportProject} 
                            className="flex items-center justify-center w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            <DownloadIcon className="w-5 h-5 mr-2" />
                            {t('project.export')}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileImport}
                            className="hidden"
                            accept=".json"
                        />
                        <button 
                            onClick={handleImportClick} 
                            className="flex items-center justify-center w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                             <UploadIcon className="w-5 h-5 mr-2" />
                            {t('project.import')}
                        </button>
                    </div>
                </div>
            </div>
      </CollapsibleSection>
    </div>
  );
};

export default ControlPanel;
