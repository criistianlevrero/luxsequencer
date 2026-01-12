import React from 'react'
import { useTranslation } from '../../i18n/hooks/useTranslation'

export const LanguageSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { locale, setLocale } = useTranslation()

  return (
    <select 
      value={locale} 
      onChange={(e) => setLocale(e.target.value as any)}
      className={className}
    >
      <option value="en">🇺🇸 English</option>
      <option value="es">🇪🇸 Español</option>
    </select>
  )
}