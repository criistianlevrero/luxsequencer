import React from 'react'
import { useTranslation } from '../../i18n/hooks/useTranslation'
import { Select } from '../shared/Select'

export const LanguageSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { locale, setLocale } = useTranslation()

  const options = [
    { 
      value: 'en', 
      label: 'English',
      icon: <span className="text-base">🇺🇸</span>,
      description: 'English language'
    },
    { 
      value: 'es', 
      label: 'Español',
      icon: <span className="text-base">🇪🇸</span>,
      description: 'Idioma español'
    }
  ];

  return (
    <Select
      value={locale}
      onChange={(value) => setLocale(value as any)}
      options={options}
      className={className}
      size="sm"
    />
  )
}