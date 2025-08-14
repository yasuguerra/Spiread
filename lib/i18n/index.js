import { es } from './es'
import { en } from './en'

// Available languages
export const LANGUAGES = {
  es: 'Español',
  en: 'English'
}

// Default language
export const DEFAULT_LANGUAGE = 'es'

// Language detection
export function detectLanguage() {
  // Try to get from localStorage first
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('spiread_language')
    if (saved && LANGUAGES[saved]) {
      return saved
    }

    // Try browser language
    const browserLang = navigator.language?.split('-')[0]
    if (browserLang && LANGUAGES[browserLang]) {
      return browserLang
    }
  }

  return DEFAULT_LANGUAGE
}

// Get translations
export function getTranslations(language = DEFAULT_LANGUAGE) {
  switch (language) {
    case 'en':
      return en
    case 'es':
    default:
      return es
  }
}

// Translation function
export function createTranslation(language = DEFAULT_LANGUAGE) {
  const translations = getTranslations(language)
  
  return function t(key, params = {}) {
    const keys = key.split('.')
    let value = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`)
      return key
    }
    
    // Simple parameter replacement
    return value.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match
    })
  }
}

// Format numbers by locale
export function formatNumber(number, locale = DEFAULT_LANGUAGE) {
  const localeMap = {
    es: 'es-ES',
    en: 'en-US'
  }
  
  return new Intl.NumberFormat(localeMap[locale] || localeMap[DEFAULT_LANGUAGE]).format(number)
}

// Format dates by locale
export function formatDate(date, locale = DEFAULT_LANGUAGE, options = {}) {
  const localeMap = {
    es: 'es-ES',
    en: 'en-US'
  }
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }
  
  return new Intl.DateTimeFormat(localeMap[locale] || localeMap[DEFAULT_LANGUAGE], defaultOptions).format(new Date(date))
}

// Format relative time by locale
export function formatRelativeTime(date, locale = DEFAULT_LANGUAGE) {
  const localeMap = {
    es: 'es-ES',
    en: 'en-US'
  }
  
  const rtf = new Intl.RelativeTimeFormat(localeMap[locale] || localeMap[DEFAULT_LANGUAGE], { numeric: 'auto' })
  const now = new Date()
  const target = new Date(date)
  const diffInMs = target.getTime() - now.getTime()
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24))
  
  if (Math.abs(diffInDays) < 1) {
    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60))
    if (Math.abs(diffInHours) < 1) {
      const diffInMinutes = Math.round(diffInMs / (1000 * 60))
      return rtf.format(diffInMinutes, 'minute')
    }
    return rtf.format(diffInHours, 'hour')
  }
  
  return rtf.format(diffInDays, 'day')
}

export { es, en }