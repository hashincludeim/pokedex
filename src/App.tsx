import { useEffect, useState } from 'react';
import { MoonIcon, Pokeball, SunIcon } from './components/Icons';
import { PokedexView } from './components/PokedexView';
import { PokemonDetail } from './components/PokemonDetail';
import { TypeCalculator } from './components/TypeCalculator';
import { DexProvider } from './lib/DexContext';
import { DEFAULT_FILTERS, filtersFromQuery, filtersToQuery, type DexFilters } from './lib/filters';
import { useTheme } from './lib/hooks';
import { replaceUrlQuietly, useHashRoute } from './lib/router';

export default function App() {
  const route = useHashRoute();
  const [theme, toggleTheme] = useTheme();
  const view = route.path[0] === 'types' ? 'types' : 'dex';
  const detailId = route.path[0] === 'pokemon' ? Number(route.path[1]) : NaN;
  const onDexList = route.path.length === 0;

  // Lifted here so filters survive switching tabs and the detail view can step through the results.
  const [filters, setFilters] = useState<DexFilters>(() => (onDexList ? filtersFromQuery(route.query) : DEFAULT_FILTERS));

  // Real navigations to the list (back/forward, a pasted link) re-seed the filters from the URL.
  const [seededAt, setSeededAt] = useState(route.navigationId);
  if (onDexList && route.navigationId !== seededAt) {
    setSeededAt(route.navigationId);
    setFilters(filtersFromQuery(route.query));
  }

  // Keep the list URL shareable without adding history entries on every keystroke.
  useEffect(() => {
    if (!onDexList) return;
    const qs = filtersToQuery(filters);
    if (window.location.hash.replace(/^#\/?/, '') !== qs) replaceUrlQuietly(`/${qs}`);
  }, [onDexList, filters]);

  const dexHref = `#/${filtersToQuery(filters)}`;

  return (
    <DexProvider>
      <header className="app-header">
        <div className="app-header__inner container">
          <a className="brand" href={dexHref}>
            <Pokeball size={30} className="brand__ball" />
            <span>
              Poké<span className="brand__accent">dex</span>
            </span>
          </a>
          <nav className="nav" aria-label="Main">
            <a className={`nav__link ${view === 'dex' ? 'is-active' : ''}`} href={dexHref} aria-current={view === 'dex' ? 'page' : undefined}>
              Pokédex
            </a>
            <a
              className={`nav__link ${view === 'types' ? 'is-active' : ''}`}
              href="#/types"
              aria-current={view === 'types' ? 'page' : undefined}
            >
              Type matchups
            </a>
          </nav>
          <button
            type="button"
            className="icon-button theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <main className="container main">
        {view === 'types' ? (
          // Remount on real navigations so a pasted/edited URL re-seeds the calculator.
          <TypeCalculator key={route.navigationId} query={route.query} />
        ) : (
          <PokedexView filters={filters} onChange={setFilters} />
        )}
      </main>

      <footer className="footer container">
        Data from{' '}
        <a href="https://pokeapi.co" target="_blank" rel="noreferrer">
          PokéAPI
        </a>
        . Pokémon and Pokémon character names are trademarks of Nintendo.
      </footer>

      {Number.isInteger(detailId) && detailId > 0 && <PokemonDetail id={detailId} filters={filters} />}
    </DexProvider>
  );
}
