import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { DarkColors, LightColors, type ThemeColors } from '@/constants/design';
import { deviceLanguage, setLocale, type Language } from '@/lib/i18n';
import { getItem, setItem } from '@/lib/storage';

export type ThemePref = 'system' | 'light' | 'dark';

const LANG_KEY = 'spliteasy.language';
const THEME_KEY = 'spliteasy.theme';

type SettingsValue = {
  ready: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  themePref: ThemePref;
  setThemePref: (pref: ThemePref) => void;
  scheme: 'light' | 'dark';
  colors: ThemeColors;
};

const SettingsContext = createContext<SettingsValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [language, setLanguageState] = useState<Language>(deviceLanguage);
  const [themePref, setThemePrefState] = useState<ThemePref>('system');

  // Load persisted preferences once.
  useEffect(() => {
    Promise.all([getItem(LANG_KEY), getItem(THEME_KEY)])
      .then(([lang, theme]) => {
        if (lang === 'es' || lang === 'en') {
          setLanguageState(lang);
          setLocale(lang);
        }
        if (theme === 'system' || theme === 'light' || theme === 'dark') {
          setThemePrefState(theme);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setLanguage = (lang: Language) => {
    setLocale(lang);
    setLanguageState(lang);
    setItem(LANG_KEY, lang);
  };

  const setThemePref = (pref: ThemePref) => {
    setThemePrefState(pref);
    setItem(THEME_KEY, pref);
  };

  const scheme: 'light' | 'dark' =
    themePref === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themePref;

  const value = useMemo<SettingsValue>(
    () => ({
      ready,
      language,
      setLanguage,
      themePref,
      setThemePref,
      scheme,
      colors: scheme === 'dark' ? DarkColors : LightColors,
    }),
    [ready, language, themePref, scheme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}

/** Returns the active theme colors; re-renders the caller when the theme changes. */
export function useColors(): ThemeColors {
  return useSettings().colors;
}
