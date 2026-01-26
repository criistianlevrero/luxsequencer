import { produce } from 'immer';
import type { StateCreator } from 'zustand';
import type { StoreState, ProjectActions } from '../types';
import type { Project, Sequence } from '../../types';
import { isLegacyControlSettings } from '../../types';
import { LOCAL_STORAGE_KEY } from '../utils/helpers';
import { migrateLegacySettings, createInitialSettings } from '../../utils/settingsMigration';
import { validateRendererSettings } from '../../utils/validation';
import { renderers } from '../../components/renderers';
import { config } from '../../config';

export const createProjectSlice: StateCreator<StoreState, [], [], ProjectActions> = (set, get) => ({
    initializeProject: (project) => {
        // Validate project version
        const currentVersion = '2.1.0';
        const projectVersion = project.version || '1.0.0';
        
        if (projectVersion !== currentVersion) {
            console.warn(`[PROJECT] Version mismatch: project is v${projectVersion}, app expects v${currentVersion}`);
            
            // Migration logic for older versions
            if (!project.version || projectVersion === '1.0.0') {
                console.log('[PROJECT] Migrating from v1.0.0 to v2.1.0');
                
                // Migrate interpolationSpeed from ms to steps (rough conversion)
                project.sequences.forEach(seq => {
                    if (seq.interpolationSpeed > 10) {
                        // Old format was in ms (e.g., 500ms -> 2 steps)
                        seq.interpolationSpeed = Math.min(8, Math.max(0, seq.interpolationSpeed / 250));
                    }
                    // Remove animateOnlyChanges if it exists
                    delete (seq as any).animateOnlyChanges;
                });
                
                project.version = currentVersion;
                console.log('[PROJECT] Migration v1.0.0 -> v2.1.0 complete');
            }
            
            // Migration from v2.0.0 to v2.1.0 (hybrid renderer system)
            if (projectVersion === '2.0.0') {
                console.log('[PROJECT] Migrating from v2.0.0 to v2.1.0 (hybrid renderer system)');
                
                project.sequences.forEach(seq => {
                    // Check if it's old structure
                    if ((seq as any).patterns && (seq as any).sequencer) {
                        const oldSeq = seq as any;
                        const currentRenderer = project.globalSettings.renderer || 'webgl';
                        
                        // Migrate to new hybrid structure
                        seq.activePatterns = oldSeq.patterns || [];
                        seq.activeRenderer = currentRenderer;
                        seq.rendererPatterns = {
                            [currentRenderer]: oldSeq.patterns || []
                        };
                        seq.rendererSequencerStates = {
                            [currentRenderer]: oldSeq.sequencer || {
                                steps: Array(16).fill(null),
                                bpm: 120,
                                numSteps: 16,
                                propertyTracks: []
                            }
                        };
                        
                        // Remove old properties
                        delete oldSeq.patterns;
                        delete oldSeq.sequencer;
                    }
                });
                
                project.version = currentVersion;
                console.log('[PROJECT] Migration v2.0.0 -> v2.1.0 complete');
            }
        }
        
        // Ensure all sequences have the hybrid structure
        project.sequences.forEach(seq => {
            if (!seq.activeRenderer) {
                seq.activeRenderer = project.globalSettings.renderer || 'webgl';
            }
            if (!seq.activePatterns) {
                seq.activePatterns = [];
            }
            if (!seq.rendererPatterns) {
                seq.rendererPatterns = {};
            }
            if (!seq.rendererSequencerStates) {
                seq.rendererSequencerStates = {};
            }
        });
        
        // Get initial settings and migrate if necessary
        const patternSettings = project.sequences[0].activePatterns[0]?.settings;
        const currentRenderer = project.globalSettings.renderer || 'webgl';
        let migratedSettings;
        
        if (patternSettings) {
            if (isLegacyControlSettings(patternSettings)) {
                console.log('[PROJECT] Migrating legacy pattern settings to new structure');
                migratedSettings = migrateLegacySettings(patternSettings);
            } else {
                migratedSettings = patternSettings;
            }
        } else {
            migratedSettings = get().currentSettings;
        }
        
        // Validate settings for current renderer
        const rendererDefinition = renderers[currentRenderer];
        if (rendererDefinition) {
            const validationResult = validateRendererSettings(rendererDefinition, migratedSettings);
            if (!validationResult.valid) {
                if (config.debug.validation) {
                    console.warn('[PROJECT] Settings validation failed:', validationResult);
                }
                // Apply validation corrections if available
                const correctedSettings = migratedSettings; // Use original settings if validation fails
                set({
                    project,
                    textureRotation: 0,
                    currentSettings: correctedSettings
                });
            } else {
                if (config.debug.validation) {
                    console.log('[PROJECT] Settings validation passed');
                }
                set({
                    project,
                    textureRotation: 0,
                    currentSettings: migratedSettings
                });
            }
        } else {
            // Renderer not found, use settings without validation
            set({
                project,
                textureRotation: 0,
                currentSettings: migratedSettings
            });
        }
        
        // Start texture rotation animation loop
        const animateRotation = () => {
            const settings = get().currentSettings;
            const speed = settings.renderer?.webgl?.textureRotationSpeed || 0;
            if (speed !== 0) {
                set(state => ({ textureRotation: (state.textureRotation + speed * 0.5) % 360 }));
            }
            requestAnimationFrame(animateRotation);
        };
        animateRotation();

        // Start sequencer if it's set to play
        if (project.globalSettings.isSequencerPlaying) {
            get()._tickSequencer();
        }
    },

    setProject: (project) => {
        set({ project });
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
        } catch (e) {
            console.error("Failed to save project to localStorage", e);
        }
    },

    setActiveSequenceIndex: (index) => {
        set({ activeSequenceIndex: index });
    },
    
    updateActiveSequence: (updates) => {
        const project = get().project;
        if (!project) return;

        const newProject = produce(project, draft => {
            Object.assign(draft.sequences[get().activeSequenceIndex], updates);
        });
        get().setProject(newProject);
    },

    saveNewSequence: (name) => {
        const project = get().project;
        if (!project) return;

        const activeSequence = project.sequences[get().activeSequenceIndex];
        const currentRenderer = project.globalSettings.renderer || 'webgl';
        
        const newSequence: Sequence = {
            id: `seq_${Date.now()}`,
            name,
            interpolationSpeed: 2, // In steps (0-8, supports fractions)
            activeRenderer: currentRenderer,
            activePatterns: activeSequence?.activePatterns || [],
            rendererPatterns: {
                [currentRenderer]: activeSequence?.activePatterns || []
            },
            rendererSequencerStates: {
                [currentRenderer]: {
                    steps: Array(16).fill(null),
                    bpm: 120,
                    numSteps: 16,
                    propertyTracks: []
                }
            }
        };

        const newProject = produce(project, draft => {
            draft.sequences.push(newSequence);
        });

        get().setProject(newProject);
        get().setActiveSequenceIndex(newProject.sequences.length - 1);
    },

    deleteSequence: (sequenceId) => {
        const project = get().project;
        if (!project || project.sequences.length <= 1) return;

        const sequenceIndex = project.sequences.findIndex(s => s.id === sequenceId);
        if (sequenceIndex === -1) return;

        const newProject = produce(project, draft => {
            draft.sequences.splice(sequenceIndex, 1);
        });

        const newActiveIndex = Math.min(get().activeSequenceIndex, newProject.sequences.length - 1);
        get().setProject(newProject);
        get().setActiveSequenceIndex(newActiveIndex);
    },

    renameSequence: (sequenceId, newName) => {
        const project = get().project;
        if (!project) return;

        const sequenceIndex = project.sequences.findIndex(s => s.id === sequenceId);
        if (sequenceIndex === -1) return;

        const newProject = produce(project, draft => {
            draft.sequences[sequenceIndex].name = newName;
        });

        get().setProject(newProject);
    },

    duplicateSequence: (sequenceId, newName) => {
        const project = get().project;
        if (!project) return;

        const sequenceIndex = project.sequences.findIndex(s => s.id === sequenceId);
        if (sequenceIndex === -1) return;

        const sourcSequence = project.sequences[sequenceIndex];
        const duplicatedSequence: Sequence = {
            ...JSON.parse(JSON.stringify(sourcSequence)),
            id: `seq_${Date.now()}`,
            name: newName
        };

        const newProject = produce(project, draft => {
            draft.sequences.push(duplicatedSequence);
        });

        get().setProject(newProject);
        get().setActiveSequenceIndex(newProject.sequences.length - 1);
    },

    exportProject: () => {
        const project = get().project;
        if (!project) return;
        const jsonString = JSON.stringify(project, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `configuracion-escamas-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importProject: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              const data: Project = JSON.parse(text);
              if (!data.globalSettings || !data.sequences) throw new Error("Invalid project file");

              data.globalSettings.isSequencerPlaying = false;
              
              // Use initializeProject to handle migration and setup
              get().initializeProject(data);
              
              const settings = data.sequences[0]?.activePatterns[0]?.settings;
              let migratedSettings;
              
              if (settings) {
                  if (isLegacyControlSettings(settings)) {
                      console.log('[PROJECT] Migrating imported legacy settings to new structure');
                      migratedSettings = migrateLegacySettings(settings);
                  } else {
                      migratedSettings = settings;
                  }
              } else {
                  migratedSettings = get().currentSettings;
              }
              
              set({
                  activeSequenceIndex: 0,
                  currentSettings: migratedSettings,
                  selectedPatternId: null,
                  sequencerCurrentStep: 0,
              });
              alert("Configuración importada con éxito.");
          } catch (error) {
              alert(`Error al importar: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
      };
      reader.readAsText(file);
    },

    resetToDefault: async () => {
        try {
            const response = await fetch('/default-project.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch default project: ${response.statusText}`);
            }
            const defaultProject: Project = await response.json();
            
            // Clear localStorage
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            
            // Reset to default state
            defaultProject.globalSettings.isSequencerPlaying = false;
            
            // Use initializeProject to handle migration and setup  
            get().initializeProject(defaultProject);
            
            const defaultSettings = defaultProject.sequences[0]?.activePatterns[0]?.settings;
            let migratedDefaultSettings;
            
            if (defaultSettings) {
                if (isLegacyControlSettings(defaultSettings)) {
                    console.log('[PROJECT] Migrating default project legacy settings to new structure');
                    migratedDefaultSettings = migrateLegacySettings(defaultSettings);
                } else {
                    migratedDefaultSettings = defaultSettings;
                }
            } else {
                migratedDefaultSettings = get().currentSettings;
            }
            
            set({
                activeSequenceIndex: 0,
                currentSettings: migratedDefaultSettings,
                selectedPatternId: null,
                sequencerCurrentStep: 0,
            });
            
            console.log('Project reset to default configuration.');
            alert('Proyecto reseteado a configuración por defecto.');
        } catch (error) {
            console.error('Failed to reset to default:', error);
            alert(`Error al resetear: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    changeRenderer: (rendererId) => {
        const { project, activeSequenceIndex } = get();
        if (!project) return;

        const activeSequence = project.sequences[activeSequenceIndex];
        if (!activeSequence) return;

        // Si ya estamos en el renderer solicitado, no hacer nada
        if (activeSequence.activeRenderer === rendererId) return;

        console.log(`[PROJECT] Changing renderer from ${activeSequence.activeRenderer} to ${rendererId}`);

        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            
            // Guardar patrones actuales en el cache del renderer anterior
            if (sequence.activePatterns.length > 0) {
                sequence.rendererPatterns[sequence.activeRenderer] = [...sequence.activePatterns];
            }

            // Guardar estado del sequencer del renderer anterior
            const currentSequencerState = get().project?.sequences[activeSequenceIndex];
            if (currentSequencerState) {
                // Necesitamos obtener el estado actual del sequencer desde el store
                const sequencerState = sequence.rendererSequencerStates[sequence.activeRenderer] || {
                    steps: Array(16).fill(null),
                    bpm: 120,
                    numSteps: 16,
                    propertyTracks: []
                };
                sequence.rendererSequencerStates[sequence.activeRenderer] = sequencerState;
            }

            // Cambiar al nuevo renderer
            sequence.activeRenderer = rendererId;

            // Cargar patrones del nuevo renderer (o array vacío si no existen)
            sequence.activePatterns = sequence.rendererPatterns[rendererId] || [];

            // Asegurar que existe el estado del sequencer para el nuevo renderer
            if (!sequence.rendererSequencerStates[rendererId]) {
                sequence.rendererSequencerStates[rendererId] = {
                    steps: Array(16).fill(null),
                    bpm: 120,
                    numSteps: 16,
                    propertyTracks: []
                };
            }

            // Actualizar el renderer global
            draft.globalSettings.renderer = rendererId;
        });

        // Actualizar proyecto y resetear configuraciones
        get().setProject(newProject);

        // Si hay patrones en el nuevo renderer, cargar el primero
        const newActivePatterns = newProject.sequences[activeSequenceIndex].activePatterns;
        if (newActivePatterns.length > 0) {
            // Cargar el primer patrón sin animación para evitar interferencia
            const firstPattern = newActivePatterns[0];
            set({
                currentSettings: {
                    ...get().currentSettings,
                    ...firstPattern.settings
                },
                selectedPatternId: firstPattern.id,
                isPatternDirty: false
            });
        } else {
            // Resetear a configuración limpia para el nuevo renderer
            set({
                selectedPatternId: null,
                isPatternDirty: false
            });
        }

        // Resetear sequencer al cambiar renderer
        set({
            sequencerCurrentStep: 0,
            sequencerStartTime: null
        });

        console.log(`[PROJECT] Renderer changed to ${rendererId}. Active patterns: ${newActivePatterns.length}`);
    },
});
