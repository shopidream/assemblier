/**
 * Shopify supported locale codes
 * Maps from common language codes to Shopify-specific locale codes
 */
export const SHOPIFY_SUPPORTED_LOCALES: Record<string, string> = {
  en: 'en',
  ko: 'ko',
  ja: 'ja',
  zh: 'zh-CN',
  fr: 'fr',
  de: 'de',
  es: 'es',
  pt: 'pt-BR',
  it: 'it',
  nl: 'nl',
  ru: 'ru',
  ar: 'ar',
  hi: 'hi',
  th: 'th',
  vi: 'vi',
  id: 'id',
  ms: 'ms',
  tr: 'tr',
  pl: 'pl',
  sv: 'sv',
  nb: 'nb',
  da: 'da',
  fi: 'fi',
  cs: 'cs',
  ro: 'ro',
  el: 'el',
  uk: 'uk',
  he: 'he',
};

/**
 * Converts CSL input language code to Shopify locale code
 * Falls back to 'en' if language is not supported
 *
 * @param language - Language code from CSL input (e.g., 'ko', 'ja', 'en')
 * @returns Shopify locale code (e.g., 'ko', 'ja', 'en')
 */
export function toShopifyLocale(language: string): string {
  return SHOPIFY_SUPPORTED_LOCALES[language] || 'en';
}
