import viJson from "@/locales/vi.json";
import enJson from "@/locales/en.json";

export type Locale = "en" | "vi";
export type TranslationDictionary = typeof viJson;

export const translations: Record<Locale, TranslationDictionary> = {
  vi: viJson,
  en: enJson,
};
