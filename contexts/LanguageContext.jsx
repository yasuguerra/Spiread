'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  detectLanguage, 
  createTranslation, 
  formatNumber, 
  formatDate, 
  formatRelativeTime,
  LANGUAGES,
  DEFAULT_LANGUAGE 
} from '@/lib/i18n'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  const [t, setT] = useState(() => createTranslation(DEFAULT_LANGUAGE))

  // Initialize language on mount
  useEffect(() => {
    const detectedLang = detectLanguage()
    setLanguage(detectedLang)
    setT(() => createTranslation(detectedLang))
  }, [])

  // Change language function
  const changeLanguage = (newLanguage) => {
    if (LANGUAGES[newLanguage]) {
      setLanguage(newLanguage)
      setT(() => createTranslation(newLanguage))
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('spiread_language', newLanguage)
      }

      // Update settings in database if user is logged in
      updateUserLanguageSettings(newLanguage)
    }
  }

  // Update user settings
  const updateUserLanguageSettings = async (newLanguage) => {
    try {
      // This would integrate with your user settings API
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
      if (userProfile.id) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userProfile.id,
            language: newLanguage
          })
        })
      }
    } catch (error) {
      console.error('Error updating language settings:', error)
    }
  }

  // Format functions with current locale
  const formatters = {
    number: (num) => formatNumber(num, language),
    date: (date, options) => formatDate(date, language, options),
    relativeTime: (date) => formatRelativeTime(date, language)
  }

  const value = {
    language,
    changeLanguage,
    t,
    ...formatters,
    availableLanguages: LANGUAGES
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext