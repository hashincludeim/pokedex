import { useMemo, useSyncExternalStore } from 'react';

export interface Route {
  path: string[];
  query: URLSearchParams;
  /** Increments on every real navigation, but not on quiet URL replacements. */
  navigationId: number;
}

let navigationId = 0;
window.addEventListener('hashchange', () => {
  navigationId++;
});

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const getHash = () => window.location.hash;

/** Minimal hash router: `#/pokemon/25` → { path: ['pokemon', '25'] }. */
export function useHashRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash);
  return useMemo(() => {
    const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
    return { path: path.split('/').filter(Boolean), query: new URLSearchParams(query), navigationId };
  }, [hash]);
}

export function navigate(to: string, { replace = false } = {}) {
  if (replace) window.location.replace(`#${to}`);
  else window.location.hash = to;
}

/** Update the URL without triggering a route change (for shareable UI state). */
export function replaceUrlQuietly(to: string) {
  window.history.replaceState(window.history.state, '', `#${to}`);
}

// When a detail view is opened from inside the app, closing it should go back
// (restoring the previous URL) instead of pushing yet another history entry.
let openedInApp = false;

export function openPokemon(id: number) {
  openedInApp = true;
  navigate(`/pokemon/${id}`);
}

export function closePokemon() {
  if (openedInApp) {
    openedInApp = false;
    window.history.back();
  } else {
    navigate('/', { replace: true });
  }
}
