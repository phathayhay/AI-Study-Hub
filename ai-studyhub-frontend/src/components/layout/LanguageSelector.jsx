import { useState, useEffect, useRef } from 'react'

const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', short: 'VI' },
  { code: 'en', name: 'English', flag: '🇺🇸', short: 'EN' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', short: 'KO' },
  { code: 'zh', name: '中文', flag: '🇨🇳', short: 'ZH' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', short: 'JA' },
]

export default function LanguageSelector() {
  const [selectedLang, setSelectedLang] = useState(() => {
    return localStorage.getItem('app_language') || 'vi'
  })
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const currentLang = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (langCode) => {
    setSelectedLang(langCode)
    localStorage.setItem('app_language', langCode)
    setIsOpen(false)
    window.dispatchEvent(new CustomEvent('languageChange', { detail: langCode }))
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-700 border border-[#e2e8f0] dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600/80 transition-all duration-200 text-xs font-medium cursor-pointer shadow-xs"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Select Language"
      >
        <span className="text-sm leading-none">{currentLang.flag}</span>
        <span className="font-semibold text-slate-800 dark:text-slate-100">{currentLang.short}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-lg ring-1 ring-black/5 py-1 z-50 transition-all duration-200 animate-in fade-in slide-in-from-top-2">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60">
            Ngôn ngữ / Language
          </div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              type="button"
              className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left cursor-pointer transition-colors duration-150 ${
                selectedLang === lang.code
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
              {selectedLang === lang.code && (
                <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
