import type { DexEntry } from './api';
import { GENERATIONS, formatName } from './format';
import { isTypeName, type TypeName } from './types';

export type SortKey = 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc';

const SORT_KEYS: readonly SortKey[] = ['id-asc', 'id-desc', 'name-asc', 'name-desc'];

export interface DexFilters {
  query: string;
  types: TypeName[];
  gen: number; // 0 = all generations
  sort: SortKey;
}

export const DEFAULT_FILTERS: DexFilters = { query: '', types: [], gen: 0, sort: 'id-asc' };

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** The entries matching the search, type and generation filters, in the chosen order. */
export function applyFilters(entries: DexEntry[], { query, types, gen, sort }: DexFilters): DexEntry[] {
  const q = query.trim().replace(/^#/, '');
  const isNumber = /^\d+$/.test(q);
  const needle = normalize(q);
  const generation = GENERATIONS.find((g) => g.id === gen);

  const results = entries.filter((e) => {
    if (generation && (e.id < generation.start || e.id > generation.end)) return false;
    if (types.length && !types.every((t) => e.types.includes(t))) return false;
    if (!q) return true;
    if (isNumber) return String(e.id).startsWith(String(Number(q)));
    return normalize(e.name).includes(needle) || normalize(formatName(e.name)).includes(needle);
  });

  switch (sort) {
    case 'id-desc':
      return results.sort((a, b) => b.id - a.id);
    case 'name-asc':
      return results.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return results.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return results;
  }
}

/** Read filters from the Pokédex URL query (e.g. `?q=char&type=fire,flying&gen=1`), ignoring invalid values. */
export function filtersFromQuery(query: URLSearchParams): DexFilters {
  const gen = Number(query.get('gen'));
  const sort = query.get('sort') as SortKey;
  return {
    query: query.get('q') ?? '',
    types: [...new Set((query.get('type') ?? '').split(',').filter(isTypeName))].slice(0, 2),
    gen: GENERATIONS.some((g) => g.id === gen) ? gen : 0,
    sort: SORT_KEYS.includes(sort) ? sort : DEFAULT_FILTERS.sort,
  };
}

/** The URL query for a set of filters, with defaults left out ("" when nothing is filtered). */
export function filtersToQuery({ query, types, gen, sort }: DexFilters): string {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (types.length) params.set('type', types.join(','));
  if (gen) params.set('gen', String(gen));
  if (sort !== DEFAULT_FILTERS.sort) params.set('sort', sort);
  const qs = params.toString().replace(/%2C/g, ',');
  return qs ? `?${qs}` : '';
}

/** The ids either side of `id` in `order`, or null at the ends (and when `id` isn't in it). */
export function neighbors(order: readonly number[], id: number): { prev: number | null; next: number | null } {
  const i = order.indexOf(id);
  if (i === -1) return { prev: null, next: null };
  return { prev: order[i - 1] ?? null, next: order[i + 1] ?? null };
}
