// =============================================================================
// @sms/web/src/lib/i18n.ts - Lightweight i18n (Nepali default + English toggle)
// Persists locale in a cookie/localStorage. Default: Nepali ("ne").
// =============================================================================
import { createContext, useContext, useCallback, useState, useEffect } from "react";

export type Locale = "ne" | "en";

export interface Translations {
  common: Record<string, string>;
  auth: Record<string, string>;
  dashboard: Record<string, string>;
  nav: Record<string, string>;
}

const LOCALE_STORAGE_KEY = "sms_locale";
const DEFAULT_LOCALE: Locale = "ne";

import neLocale from "../locales/ne.json";
import enLocale from "../locales/en.json";

const dictionaries: Record<Locale, Translations> = {
  ne: neLocale as Translations,
  en: enLocale as Translations,
};

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
    if (stored === "ne" || stored === "en") return stored;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  useEffect(() => {
    const saved = getStoredLocale();
    if (saved !== locale) setLocaleState(saved);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
      // Also set a cookie so server/middleware can read it
      document.cookie = `sms_locale=${next}; path=/; max-age=31536000`;
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = dictionaries[locale];
      const parts = key.split(".");
      let value: unknown = dict;
      for (const part of parts) {
        value = (value as Record<string, unknown>)?.[part];
      }
      let text = typeof value === "string" ? value : key;
      if (params) {
        text = text.replace(/\{\{(\w+)\}\}/g, (_match, p) => String(params?.[p] ?? ""));
      }
      return text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}

export default { useTranslation, I18nProvider };
