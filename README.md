# Pokédex

A Pokédex browser and type matchup calculator built with React, TypeScript and Vite, powered by [PokéAPI](https://pokeapi.co).

**Live demo: [pokedex.hashimsalim.com](https://pokedex.hashimsalim.com/)**

## Features

**Pokédex**
- All 1,025 species with official artwork, infinite scroll, and type-tinted cards
- Search by name or number, filter by up to two types and by generation, sort by number or name. These settings are kept in the URL, so a filtered list can be bookmarked or shared
- Detail view with flavor text, height/weight, abilities (with descriptions), gender ratio, base stats, defensive matchups, and the full evolution chain (including branching evolutions and their conditions)
- Alternate forms (Mega, regional, Gigantamax…), shiny artwork toggle, and cries
- Previous/next (and `←`/`→`) step through the current filtered and sorted results, or by number when the Pokémon isn't in them; `Esc` closes

**Type matchups**
- *Defense*: pick one or two types (or search for a Pokémon) to see every weakness, resistance, and immunity, plus which Pokémon share that typing
- *Attack*: pick up to four move types to see coverage against every type and every Pokémon, including the "walls" your moves can't hit hard
- The full 18×18 type chart with hover crosshairs
- Selections are kept in the URL, so results can be shared

**General**
- Light and dark themes (follows the system setting by default)
- Responsive layout; the detail view becomes a bottom sheet on phones

## Getting started

```bash
npm install
npm run dev
```

`npm test` runs the unit tests (Vitest) for the type math, filtering, URL state, evolution text, and name formatting.

`npm run build` type-checks and produces a static site in `dist/` that can be hosted anywhere.

## Deployment

Every push to `main` runs the tests, then builds and deploys to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The site is served at [pokedex.hashimsalim.com](https://pokedex.hashimsalim.com) via a `CNAME` record (`pokedex` → `hashincludeim.github.io`) at the DNS provider.

## How the data is loaded

On first visit the app makes 19 requests: the species list plus one per type. From these it builds both the searchable index (every species with its types) and the type chart. The result is cached in `localStorage` for 7 days, so later visits load instantly. Detail data (Pokémon, species, evolution chains, abilities) is fetched on demand and deduplicated in memory.

## Project layout

```
src/
  lib/
    api.ts          PokéAPI client, response types, index + type chart builder
    types.ts        Type list, colors, effectiveness math
    filters.ts      Pokédex filtering, sorting, and their URL form
    evolution.ts    Evolution conditions → readable text
    format.ts       Name formatting, generations, sprite URLs
    router.ts       Tiny hash router
    DexContext.tsx  Shared index/type chart provider
    hooks.ts        useAsync, useTheme
    *.test.ts       Unit tests
  components/
    PokedexView     Search, filters, grid
    PokemonDetail   Detail modal (About / Stats / Matchups / Evolution)
    TypeCalculator  Defense & attack calculators
    TypeChartGrid   Full type chart
    …
  test/
    fixtures.ts     Full type chart and sample entries for tests
  styles.css        Design tokens, themes, and all component styles
```
