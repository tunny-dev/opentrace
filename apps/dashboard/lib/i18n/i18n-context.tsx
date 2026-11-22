"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback, useContext } from "react";
import { type Locale, type TranslationDictionary, translations } from "./translations";

export type TranslateParams = Record<string, string | number>;

/**
 * `t("path")`, `t("path", "fallback")`, `t("path", { count: 3 })` or
 * `t("path", "fallback", { count: 3 })`. Placeholders look like `{count}`.
 */
export type TranslateFn = (
  path: string,
  fallbackOrParams?: string | TranslateParams,
  params?: TranslateParams
) => string;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TranslateFn;
  dict: TranslationDictionary;
  isVietnamese: boolean;
}

const I18nContext = React.createContext<I18nContextType | null>(null);

const STORAGE_KEY = "opentrace_locale";

function interpolate(text: string, params?: TranslateParams) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match
  );
}

function translate(
  dict: TranslationDictionary,
  path: string,
  fallbackOrParams?: string | TranslateParams,
  maybeParams?: TranslateParams
): string {
  const fallback = typeof fallbackOrParams === "string" ? fallbackOrParams : undefined;
  const params = typeof fallbackOrParams === "object" ? fallbackOrParams : maybeParams;

  // Resolve dot-notated paths, e.g. "common.overview"
  let current: unknown = dict;
  for (const part of path.split(".")) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return interpolate(fallback ?? path, params);
    }
  }
  return interpolate(typeof current === "string" ? current : (fallback ?? path), params);
}

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

  const t = useCallback<TranslateFn>(
    (path, fallbackOrParams, params) => translate(dict, path, fallbackOrParams, params),
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

const fallbackContext: I18nContextType = {
  locale: "vi",
  setLocale: () => {},
  toggleLocale: () => {},
  t: (path, fallbackOrParams, params) =>
    translate(translations.vi, path, fallbackOrParams, params),
  dict: translations.vi,
  isVietnamese: true,
};

export function useI18n(): I18nContextType {
  // Graceful fallback for components rendered outside I18nProvider
  return useContext(I18nContext) ?? fallbackContext;
}

// Convenient alias
export const useTranslation = useI18n;
