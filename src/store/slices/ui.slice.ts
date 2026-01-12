import { produce } from 'immer';
import type { StateCreator } from 'zustand';
import type { StoreState, UIActions } from '../types';
import type { LocaleCode } from '../../i18n/types';
import { setLocale as setI18nLocale, initializeI18n } from '../../i18n';

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
        const { project } = get();
        if (!project) return;

        const newProject = produce(project, draft => {
            draft.globalSettings.renderer = renderer;
        });
        get().setProject(newProject);
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
