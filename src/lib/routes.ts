import { defaultLocale, locales, type Locale } from '@/i18n/config';
import { isLocale } from '@/i18n/utils';

export function localeStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}

export function resolveLang(params: { lang?: string }): Locale {
  return isLocale(params.lang) ? params.lang : defaultLocale;
}
