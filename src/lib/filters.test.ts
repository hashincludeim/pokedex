import { describe, expect, it } from 'vitest';
import { ENTRIES } from '../test/fixtures';
import { DEFAULT_FILTERS, applyFilters, filtersFromQuery, filtersToQuery, neighbors, type DexFilters } from './filters';

const ids = (filters: Partial<DexFilters>) => applyFilters(ENTRIES, { ...DEFAULT_FILTERS, ...filters }).map((e) => e.id);

describe('applyFilters', () => {
  it('returns everything in number order by default', () => {
    expect(ids({})).toEqual(ENTRIES.map((e) => e.id));
  });

  it('searches names case-insensitively', () => {
    expect(ids({ query: 'CHAR' })).toEqual([4, 6]);
  });

  it('matches display names regardless of punctuation', () => {
    expect(ids({ query: 'Mr. Mime' })).toEqual([122]);
    expect(ids({ query: 'Farfetch’d' })).toEqual([83]);
    expect(ids({ query: 'hooh' })).toEqual([250]);
  });

  it('searches numbers by prefix, ignoring # and leading zeros', () => {
    expect(ids({ query: '25' })).toEqual([25, 250, 255]);
    expect(ids({ query: '#025' })).toEqual([25, 250, 255]);
  });

  it('requires every selected type, in any order', () => {
    expect(ids({ types: ['fire'] })).toEqual([4, 6, 250, 255]);
    expect(ids({ types: ['flying', 'fire'] })).toEqual([6, 250]);
  });

  it('filters by generation', () => {
    expect(ids({ gen: 2 })).toEqual([250]);
    expect(ids({ gen: 9 })).toEqual([906]);
    expect(ids({ gen: 3, types: ['fire'] })).toEqual([255]);
  });

  it('sorts by number or name in either direction', () => {
    expect(ids({ types: ['fire'], sort: 'id-desc' })).toEqual([255, 250, 6, 4]);
    expect(ids({ types: ['fire'], sort: 'name-asc' })).toEqual([6, 4, 250, 255]);
    expect(ids({ types: ['fire'], sort: 'name-desc' })).toEqual([255, 250, 4, 6]);
  });

  it('does not reorder the input', () => {
    const before = [...ENTRIES];
    applyFilters(ENTRIES, { ...DEFAULT_FILTERS, sort: 'name-desc' });
    expect(ENTRIES).toEqual(before);
  });
});

describe('filters in the URL', () => {
  const roundTrip = (filters: DexFilters) => filtersFromQuery(new URLSearchParams(filtersToQuery(filters)));

  it('leaves defaults out of the query', () => {
    expect(filtersToQuery(DEFAULT_FILTERS)).toBe('');
    expect(filtersToQuery({ ...DEFAULT_FILTERS, gen: 1 })).toBe('?gen=1');
  });

  it('writes readable type lists', () => {
    expect(filtersToQuery({ ...DEFAULT_FILTERS, types: ['fire', 'flying'] })).toBe('?type=fire,flying');
  });

  it('round-trips every field, including awkward search text', () => {
    const filters: DexFilters = { query: '#25 mr. mime? & co', types: ['psychic', 'fairy'], gen: 1, sort: 'name-desc' };
    expect(roundTrip(filters)).toEqual(filters);
    expect(roundTrip(DEFAULT_FILTERS)).toEqual(DEFAULT_FILTERS);
  });

  it('ignores invalid values from hand-edited URLs', () => {
    expect(filtersFromQuery(new URLSearchParams('type=fire,banana,fire,water,grass&gen=12&sort=best'))).toEqual({
      ...DEFAULT_FILTERS,
      types: ['fire', 'water'],
    });
  });
});

describe('neighbors', () => {
  const order = [6, 4, 250, 255];

  it('finds the ids either side', () => {
    expect(neighbors(order, 4)).toEqual({ prev: 6, next: 250 });
  });

  it('stops at the ends', () => {
    expect(neighbors(order, 6)).toEqual({ prev: null, next: 4 });
    expect(neighbors(order, 255)).toEqual({ prev: 250, next: null });
  });

  it('has no neighbors for an id outside the list', () => {
    expect(neighbors(order, 25)).toEqual({ prev: null, next: null });
  });
});
