"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback, useContext } from "react";
import { type Locale, type TranslationDictionary, translations } from "./translations";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (path: string, fallback?: string) => string;
  dict: TranslationDictionary;
  isVietnamese: boolean;
}

const I18nContext = React.createContext<I18nContextType | null>(null);

const STORAGE_KEY = "opentrace_locale";

export function I18nProvider({
  children,
  defaultLocale = "en",
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
}) {
  // Use lazy initializer to immediately read localStorage on client mount,
  // preventing hydration flash where English users briefly see Vietnamese.
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
        if (stored === "en" || stored === "vi") return stored;
        const browserLang = navigator.language || "";
        if (browserLang.startsWith("en")) return "en";
      } catch {
        // Ignore storage access errors
      }
    }
    return defaultLocale;
  });
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage or browser language
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === "en" || stored === "vi") {
        setLocaleState(stored);
      } else {
        // Detect browser language
        const browserLang = typeof navigator !== "undefined" ? navigator.language : "";
        if (browserLang.startsWith("en")) {
          setLocaleState("en");
        } else if (browserLang.startsWith("vi")) {
          setLocaleState("vi");
        }
      }
    } catch {
      // Ignore storage access errors
    } finally {
      setMounted(true);
    }
  }, []);

  // Sync with document element lang attribute
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "vi" ? "en" : "vi");
  }, [locale, setLocale]);

  const dict = translations[locale] || translations.vi;

  // Helper function to resolve dot-notated paths, e.g. "common.overview"
  const t = useCallback(
    (path: string, fallback?: string): string => {
      const parts = path.split(".");
      let current: any = dict;
      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
        } else {
          return fallback ?? path;
        }
      }
      return typeof current === "string" ? current : (fallback ?? path);
    },
    [dict]
  );

  const value = useMemo<I18nContextType>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
      dict,
      isVietnamese: locale === "vi",
    }),
    [locale, setLocale, toggleLocale, t, dict]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Graceful fallback for components rendered outside I18nProvider
    const fallbackDict = translations.vi;
    return {
      locale: "vi" as Locale,
      setLocale: () => {},
      toggleLocale: () => {},
      t: (path: string, fallback?: string) => {
        const parts = path.split(".");
        let current: any = fallbackDict;
        for (const part of parts) {
          if (current && typeof current === "object" && part in current) {
            current = current[part];
          } else {
            return fallback ?? path;
          }
        }
        return typeof current === "string" ? current : (fallback ?? path);
      },
      dict: fallbackDict,
      isVietnamese: true,
    };
  }
  return ctx;
}

// Convenient alias
export const useTranslation = useI18n;
