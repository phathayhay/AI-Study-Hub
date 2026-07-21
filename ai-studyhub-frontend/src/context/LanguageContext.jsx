import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('app_language') || 'vi'
  })

  useEffect(() => {
    const handleLangChange = (event) => {
      if (event.detail) {
        setLang(event.detail)
      }
    }
    window.addEventListener('languageChange', handleLangChange)
    return () => window.removeEventListener('languageChange', handleLangChange)
  }, [])

  const changeLanguage = (newLang) => {
    setLang(newLang)
    localStorage.setItem('app_language', newLang)
    window.dispatchEvent(new CustomEvent('languageChange', { detail: newLang }))
  }

  const t = (key) => {
    const currentDict = translations[lang] || translations.vi
    return currentDict[key] || translations.en?.[key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    const currentLang = localStorage.getItem('app_language') || 'vi'
    const t = (key) => (translations[currentLang] || translations.vi)[key] || key
    return { lang: currentLang, changeLanguage: () => {}, t }
  }
  return context
}
