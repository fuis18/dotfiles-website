import { getCollection } from 'astro:content';

import type { Locale } from '@/i18n/config';
import type { CategoryId } from '@/data/categories';
import { categories } from '@/data/categories';
import { entryOrder } from '@/data/order';
import { entryHref, parseEntryId, selectLocalized, t } from '@/i18n/utils';

export interface SectionCard {
  href: string;
  title: string;
  description: string;
  category: CategoryId;
  tags: string[];
}

export interface Section {
  id: CategoryId;
  title: string;
  description: string;
  cards: SectionCard[];
}

export async function getSections(lang: Locale): Promise<Section[]> {
  const entries = await getCollection('entries');
  const localized = selectLocalized(entries, lang);

  const rankOf = (category: CategoryId, entryId: string): number => {
    const slug = parseEntryId(entryId).slug;
    const name = slug.split('/').pop() ?? slug;
    const index = entryOrder[category].indexOf(name);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  return categories
    .map(({ id }) => ({
      id,
      title: t(lang, `category.${id}`),
      description: t(lang, `category.${id}.desc`),
      cards: localized
        .filter((entry) => entry.data.category === id)
        .sort((a, b) => {
          const rankDiff = rankOf(id, a.id) - rankOf(id, b.id);
          return rankDiff !== 0 ? rankDiff : a.data.title.localeCompare(b.data.title);
        })
        .map((entry) => ({
          href: entryHref(lang, parseEntryId(entry.id).slug),
          title: entry.data.title,
          description: entry.data.description,
          category: id,
          tags: entry.data.tags,
        })),
    }))
    .filter((section) => section.cards.length > 0);
}
