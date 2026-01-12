import { useCallback } from 'react'
import { useTextureStore } from '../../store'
import { t, getCurrentLocale, setLocale } from '../index'
import type { TranslationKeys, LocaleCode, TranslationParams } from '../types'

export const useTranslation = () => {
  const currentLocale = useTextureStore(state => state.currentLocale)
  const setStoreLocale = useTextureStore(state => state.setLocale)

  const translate = useCallback((key: keyof TranslationKeys, params?: TranslationParams): string => {
    return t(key, params)
  }, [currentLocale])

  const changeLocale = useCallback((locale: LocaleCode) => {
    setLocale(locale) // Update rosetta directly first
    setStoreLocale(locale) // Then update store
  }, [setStoreLocale])

  return {
    t: translate,
    locale: currentLocale,
    setLocale: changeLocale,
    availableLocales: ['en', 'es'] as LocaleCode[]
  }
}