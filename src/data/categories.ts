export const categoryIds = ['apps', 'iso', 'utilities'] as const;

export type CategoryId = (typeof categoryIds)[number];

export const categories: { id: CategoryId; order: number }[] = [
  { id: 'iso', order: 1 },
  { id: 'utilities', order: 2 },
  { id: 'apps', order: 3 },
];
