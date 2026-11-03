import { defaultLocale, locales, type Locale } from './config';
import { ui, type TranslationKey } from './ui';

export function isLocale(value: string | undefined): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function t(lang: Locale, key: TranslationKey): string {
  return ui[lang][key] ?? ui[defaultLocale][key];
}

export function parseEntryId(id: string): { slug: string; lang: Locale } {
  const [first, ...rest] = id.split('/');
  if (first && rest.length > 0 && isLocale(first)) {
    return { slug: rest.join('/'), lang: first };
  }
  return { slug: id, lang: defaultLocale };
}

export function selectLocalized<T extends { id: string }>(entries: T[], lang: Locale): T[] {
  const bySlug = new Map<string, Partial<Record<Locale, T>>>();
  for (const entry of entries) {
    const { slug, lang: entryLang } = parseEntryId(entry.id);
    const group = bySlug.get(slug) ?? {};
    group[entryLang] = entry;
    bySlug.set(slug, group);
  }
  const result: T[] = [];
  for (const group of bySlug.values()) {
    const picked = group[lang] ?? group[defaultLocale];
    if (picked) result.push(picked);
  }
  return result;
}

export function entryHref(lang: Locale, slug: string): string {
  return `${import.meta.env.BASE_URL}${lang}/${slug}`;
}

export function homeHref(lang: Locale): string {
  return `${import.meta.env.BASE_URL}${lang}/`;
}
