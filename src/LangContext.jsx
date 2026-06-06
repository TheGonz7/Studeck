import { createContext, useContext, useState } from 'react'
import { translations, getInitialLang } from './i18n'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang())

  function changeLang(newLang) {
    setLang(newLang)
    localStorage.setItem('studeck_lang', newLang)
  }

  // función t() que traduce: t('login') devuelve 'Iniciar sesión' o 'Sign in'
  const t = (key) => translations[lang]?.[key] || translations['en'][key] || key

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
