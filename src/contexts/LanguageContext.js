// AI-assisted: see docs/AI_LOG.md #9
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LANGUAGE, strings, translate } from "../i18n/strings";

// RULE: AsyncStorage only stores preferences like the language, never sensitive data
const LANGUAGE_KEY = "@app_language";

const isSupported = (language) =>
  Object.prototype.hasOwnProperty.call(strings, language);

// The default value lets t() work even when a component is tested without the Provider
export const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => translate(DEFAULT_LANGUAGE, key),
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);

  // Restores the language the driver picked last time
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (isSupported(stored)) setLanguageState(stored);
      })
      .catch((error) => console.error("Error reading the language:", error));
  }, []);

  const setLanguage = (next) => {
    if (!isSupported(next)) return;
    setLanguageState(next);
    AsyncStorage.setItem(LANGUAGE_KEY, next).catch((error) =>
      console.error("Error saving the language:", error),
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
