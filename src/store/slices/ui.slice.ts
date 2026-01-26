import { produce } from 'immer';
import type { StateCreator } from 'zustand';
import type { StoreState, UIActions } from '../types';
import type { LocaleCode } from '../../i18n/types';
import { setLocale as setI18nLocale, initializeI18n } from '../../i18n';
import { validateRendererSettings } from '../../utils/validation';
import { createInitialSettings } from '../../utils/settingsMigration';
import { renderers } from '../../components/renderers';
import { config } from '../../config';

// LocalStorage key for locale persistence
const LOCALE_STORAGE_KEY = 'luxsequencer_locale';

// Load saved locale or detect browser locale
const loadSavedLocale = (): LocaleCode => {
    try {
        const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
        if (savedLocale && (savedLocale === 'en' || savedLocale === 'es')) {
            return savedLocale as LocaleCode;
        }
    } catch (error) {
        console.warn('Failed to load saved locale from localStorage:', error);
    }
    
    // Fallback to browser locale detection
    const browserLang = navigator.language?.toLowerCase();
    return browserLang?.startsWith('es') ? 'es' : 'en';
};

// Save locale to localStorage
const saveLocale = (locale: LocaleCode) => {
    try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch (error) {
        console.warn('Failed to save locale to localStorage:', error);
    }
};

// Get initial locale and initialize i18n system
export const initialLocale = loadSavedLocale();
initializeI18n(initialLocale);

export const createUISlice: StateCreator<StoreState, [], [], UIActions> = (set, get) => ({
    clearMidiLog: () => set({ midiLog: [] }),
    
    setViewportMode: (mode) => set({ viewportMode: mode }),
    
    setRenderer: (renderer) => {
        const { project, currentSettings } = get();
        if (!project) return;

        const newProject = produce(project, draft => {
            draft.globalSettings.renderer = renderer;
        });
        get().setProject(newProject);
        
        // Validate and migrate current settings for the new renderer
        const migratedSettings = createInitialSettings(renderer, currentSettings);
        const rendererDefinition = renderers[renderer];
        
        if (rendererDefinition) {
            const validationResult = validateRendererSettings(rendererDefinition, migratedSettings);
            
            if (!validationResult.valid) {
                if (config.debug.validation) {
                    console.warn(`[UI] Settings validation failed when switching to ${renderer}:`, validationResult);
                }
                // Apply validation corrections if available
                const correctedSettings = migratedSettings; // Use original settings if validation fails
                set({ currentSettings: correctedSettings });
            } else {
                if (config.debug.validation) {
                    console.log(`[UI] Settings validation passed for renderer ${renderer}`);
                }
                set({ currentSettings: migratedSettings });
            }
        } else {
            // Renderer not found, use migrated settings without validation
            set({ currentSettings: migratedSettings });
        }
    },
    
    setLocale: (locale) => {
        console.log('Store setLocale called with:', locale);
        
        // Update i18n system first
        setI18nLocale(locale);
        
        // Save to localStorage
        saveLocale(locale);
        
        // Update store state
        set({ currentLocale: locale });
        
        console.log('Locale updated to:', locale);
    },
});

// Export the initial locale for use in store initialization
