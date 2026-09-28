import { useEffect, useMemo, useRef, useState } from 'react';
import { useDex } from '../lib/DexContext';
import { DEFAULT_FILTERS, applyFilters, type DexFilters, type SortKey } from '../lib/filters';
import { GENERATIONS } from '../lib/format';
import { TYPES, type TypeName } from '../lib/types';
import { CloseIcon, SearchIcon } from './Icons';
import { PokemonCard, PokemonCardSkeleton } from './PokemonCard';
import { ErrorState } from './States';
import { TypeBadge } from './TypeBadge';

const PAGE_SIZE = 60;

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'id-asc', label: 'Lowest number' },
  { value: 'id-desc', label: 'Highest number' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];

interface PokedexViewProps {
  filters: DexFilters;
  onChange: (filters: DexFilters) => void;
}

export function PokedexView({ filters, onChange }: PokedexViewProps) {
  const { data, loading, error, retry } = useDex();
  const results = useMemo(() => applyFilters(data?.entries ?? [], filters), [data, filters]);

  // Reset the visible window whenever the filters change.
  const filterKey = JSON.stringify(filters);
  const [shown, setShown] = useState({ key: filterKey, count: PAGE_SIZE });
  const count = shown.key === filterKey ? shown.count : PAGE_SIZE;
  const visible = results.slice(0, count);
  const hasMore = count < results.length;

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setShown({ key: filterKey, count: count + PAGE_SIZE }),
      { rootMargin: '900px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filterKey, count, hasMore]);

  const set = <K extends keyof DexFilters>(key: K, value: DexFilters[K]) => onChange({ ...filters, [key]: value });

  const toggleType = (t: TypeName) => {
    const has = filters.types.includes(t);
    // Pokémon have at most two types, so keep the two most recent picks.
    set('types', has ? filters.types.filter((x) => x !== t) : [...filters.types, t].slice(-2));
  };

  const isFiltered = filterKey !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <section className="dex">
      <header className="page-header">
        <div>
          <h1>Pokédex</h1>
          <p className="page-header__sub">
            {data ? `${data.entries.length.toLocaleString()} Pokémon across ${GENERATIONS.length} generations` : 'Loading the national Pokédex…'}
          </p>
        </div>
      </header>

      <div className="toolbar">
        <div className="toolbar__row">
          <label className="search">
            <SearchIcon className="search__icon" />
            <input
              type="search"
              placeholder="Search by name or number"
              value={filters.query}
              onChange={(e) => set('query', e.target.value)}
              aria-label="Search Pokémon"
            />
            {filters.query && (
              <button type="button" className="search__clear" onClick={() => set('query', '')} aria-label="Clear search">
                <CloseIcon width={16} height={16} />
              </button>
            )}
          </label>

          <select
            className="select"
            value={filters.gen}
            onChange={(e) => set('gen', Number(e.target.value))}
            aria-label="Generation"
          >
            <option value={0}>All generations</option>
            {GENERATIONS.map((g) => (
              <option key={g.id} value={g.id}>
                Gen {g.numeral} · {g.region}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={filters.sort}
            onChange={(e) => set('sort', e.target.value as SortKey)}
            aria-label="Sort order"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="type-filter" role="group" aria-label="Filter by type">
          {TYPES.map((t) => (
            <TypeBadge
              key={t}
              type={t}
              size="sm"
              onClick={() => toggleType(t)}
              selected={filters.types.includes(t)}
              dimmed={filters.types.length > 0 && !filters.types.includes(t)}
            />
          ))}
        </div>
      </div>

      <div className="results-bar">
        <span>
          {data && (
            <>
              <strong>{results.length.toLocaleString()}</strong> {results.length === 1 ? 'result' : 'results'}
            </>
          )}
        </span>
        {isFiltered && (
          <button type="button" className="link-button" onClick={() => onChange(DEFAULT_FILTERS)}>
            Reset filters
          </button>
        )}
      </div>

      {error ? (
        <ErrorState message="Couldn’t reach PokéAPI. Check your connection and try again." onRetry={retry} />
      ) : loading && !data ? (
        <div className="poke-grid">
          {Array.from({ length: 18 }, (_, i) => (
            <PokemonCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <h3>No Pokémon found</h3>
          <p>Try a different name, or loosen the type and generation filters.</p>
          <button type="button" className="button" onClick={() => onChange(DEFAULT_FILTERS)}>
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <div className="poke-grid">
            {visible.map((entry) => (
              <PokemonCard key={entry.id} entry={entry} />
            ))}
          </div>
          {hasMore && <div ref={sentinel} className="grid-sentinel" aria-hidden="true" />}
        </>
      )}
    </section>
  );
}
