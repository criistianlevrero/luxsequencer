import rosetta from 'rosetta'
import { translations } from './translations'
import type { TranslationKeys, LocaleCode, TranslationParams } from './types'

// Create rosetta instance without TypeScript generics first
const r = rosetta()

// Helper function to convert flat dot notation to nested objects for rosetta
const flatToNested = (flat: Record<string, string>): any => {
  const nested: any = {}
  
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let current = nested
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!(part in current)) {
        current[part] = {}
      }
      current = current[part]
    }
    
    current[parts[parts.length - 1]] = value
  }
  
  return nested
}

// Convert flat translations to nested structure for rosetta
const nestedEn = flatToNested(translations.en)
const nestedEs = flatToNested(translations.es)

// Add translations to rosetta
r.set('en', nestedEn);
r.set('es', nestedEs);

// Detectar idioma inicial del navegador
const getBrowserLocale = (): LocaleCode => {
  const browserLang = navigator.language.split('-')[0]
  return (['en', 'es'] as LocaleCode[]).includes(browserLang as LocaleCode) 
    ? (browserLang as LocaleCode) 
    : 'en'
}

// Configurar idioma inicial
r.locale(getBrowserLocale())

// Inicializar sistema i18n con idioma del store
export const initializeI18n = (locale: LocaleCode): void => {
  r.locale(locale)
}

// Exportar funciones principales
export const t = (key: keyof TranslationKeys, params?: TranslationParams): string => {
  const result = r.t(key as string, params) || key as string;
  
  // Only log translation failures in development mode
  if (result === key && process.env.NODE_ENV === 'development') {
    console.warn(`Translation missing for key: ${key}`);
  }
  
  return result;
}

export const setLocale = (locale: LocaleCode): void => {
  r.locale(locale)
}

export const getCurrentLocale = (): LocaleCode => {
  return r.locale() as LocaleCode
}

export const getAvailableLocales = (): LocaleCode[] => {
  return ['en', 'es']
}

export { type TranslationKeys, type LocaleCode, type TranslationParams }