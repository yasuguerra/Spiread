'use client'

import { useState, useEffect, useCallback } from 'react'

export function useAccessibility() {
  const [settings, setSettings] = useState({
    dyslexiaFont: false,
    highContrast: false,
    reduceMotion: false,
    keyboardNavigation: true,
    screenReader: false
  })

  // Initialize accessibility settings
  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('spiread_accessibility')
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved)
        setSettings(prev => ({ ...prev, ...parsedSettings }))
      } catch (error) {
        console.error('Error parsing accessibility settings:', error)
      }
    }

    // Detect system preferences
    if (typeof window !== 'undefined') {
      // Detect prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) {
        setSettings(prev => ({ ...prev, reduceMotion: true }))
      }

      // Detect high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      if (prefersHighContrast) {
        setSettings(prev => ({ ...prev, highContrast: true }))
      }

      // Basic screen reader detection
      const hasScreenReader = window.navigator.userAgent.includes('NVDA') || 
                             window.navigator.userAgent.includes('JAWS') ||
                             window.speechSynthesis !== undefined
      if (hasScreenReader) {
        setSettings(prev => ({ ...prev, screenReader: true }))
      }
    }
  }, [])

  // Apply accessibility settings to document
  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    // Apply dyslexia font
    if (settings.dyslexiaFont) {
      root.style.setProperty('--font-family-dyslexia', '"OpenDyslexic", "Comic Sans MS", cursive')
      root.classList.add('dyslexia-font')
    } else {
      root.classList.remove('dyslexia-font')
    }

    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Apply reduced motion
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // Apply keyboard navigation styles
    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation')
    } else {
      root.classList.remove('keyboard-navigation')
    }

    // Save to localStorage
    localStorage.setItem('spiread_accessibility', JSON.stringify(settings))
  }, [settings])

  // Update individual settings
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  // Toggle settings
  const toggleSetting = useCallback((key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Keyboard event handlers
  const handleKeyboardNavigation = useCallback((event) => {
    if (!settings.keyboardNavigation) return

    const { key, target } = event
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const focusableArray = Array.from(focusableElements)
    const currentIndex = focusableArray.indexOf(target)

    switch (key) {
      case 'Tab':
        // Tab navigation is handled by browser
        break
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        if (currentIndex < focusableArray.length - 1) {
          focusableArray[currentIndex + 1].focus()
        }
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        if (currentIndex > 0) {
          focusableArray[currentIndex - 1].focus()
        }
        break
      case 'Enter':
      case ' ':
        if (target.tagName === 'BUTTON' || target.hasAttribute('role')) {
          event.preventDefault()
          target.click()
        }
        break
      case 'Escape':
        // Close modals, pause games, etc.
        const escapeEvent = new CustomEvent('accessibility:escape', { bubbles: true })
        target.dispatchEvent(escapeEvent)
        break
    }
  }, [settings.keyboardNavigation])

  // Screen reader announcements
  const announce = useCallback((message, priority = 'polite') => {
    if (!settings.screenReader) return

    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [settings.screenReader])

  // Focus management
  const focusTrap = useCallback((containerElement) => {
    if (!settings.keyboardNavigation) return () => {}

    const focusableElements = containerElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    containerElement.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      containerElement.removeEventListener('keydown', handleTabKey)
    }
  }, [settings.keyboardNavigation])

  // ARIA helpers
  const getAriaProps = useCallback((type, props = {}) => {
    const ariaProps = { ...props }

    switch (type) {
      case 'button':
        return {
          role: 'button',
          tabIndex: 0,
          'aria-pressed': ariaProps.pressed,
          'aria-expanded': ariaProps.expanded,
          'aria-label': ariaProps.label,
          ...ariaProps
        }
      case 'progressbar':
        return {
          role: 'progressbar',
          'aria-valuenow': ariaProps.value,
          'aria-valuemin': ariaProps.min || 0,
          'aria-valuemax': ariaProps.max || 100,
          'aria-label': ariaProps.label,
          ...ariaProps
        }
      case 'alert':
        return {
          role: 'alert',
          'aria-live': 'assertive',
          'aria-atomic': 'true',
          ...ariaProps
        }
      case 'status':
        return {
          role: 'status',
          'aria-live': 'polite',
          'aria-atomic': 'true',
          ...ariaProps
        }
      default:
        return ariaProps
    }
  }, [])

  return {
    settings,
    updateSetting,
    toggleSetting,
    handleKeyboardNavigation,
    announce,
    focusTrap,
    getAriaProps
  }
}

export default useAccessibility