// AI-assisted: see docs/AI_LOG.md #9
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LANGUAGE, strings, translate } from "../i18n/strings";

// REGLA: AsyncStorage solo guarda preferencias como el idioma, nunca datos sensibles
const LANGUAGE_KEY = "@app_language";

const isSupported = (language) =>
  Object.prototype.hasOwnProperty.call(strings, language);

// El valor por defecto deja usar t() aunque un componente se pruebe sin el Provider
export const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => translate(DEFAULT_LANGUAGE, key),
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);

  // Recupera el idioma que el conductor eligió la última vez
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (isSupported(stored)) setLanguageState(stored);
      })
      .catch((error) => console.error("Error leyendo el idioma:", error));
  }, []);

  const setLanguage = (next) => {
    if (!isSupported(next)) return;
    setLanguageState(next);
    AsyncStorage.setItem(LANGUAGE_KEY, next).catch((error) =>
      console.error("Error guardando el idioma:", error),
    );
  };

  const t = (key) => translate(language, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
