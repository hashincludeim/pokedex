import { idFromUrl } from './format';
import { TYPES, isTypeName, type TypeChart, type TypeName } from './types';

const API = 'https://pokeapi.co/api/v2';

// ---------------------------------------------------------------------------
// Response shapes (only the fields this app reads)
// ---------------------------------------------------------------------------

export interface NamedResource {
  name: string;
  url: string;
}

interface Localized {
  language: NamedResource;
}

export interface NamedList {
  count: number;
  results: NamedResource[];
}

export interface TypeResponse {
  name: string;
  damage_relations: {
    double_damage_to: NamedResource[];
    half_damage_to: NamedResource[];
    no_damage_to: NamedResource[];
  };
  pokemon: { slot: number; pokemon: NamedResource }[];
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  types: { slot: number; type: NamedResource }[];
  abilities: { is_hidden: boolean; slot: number; ability: NamedResource }[];
  stats: { base_stat: number; stat: NamedResource }[];
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: { front_default: string | null; front_shiny: string | null };
      home?: { front_default: string | null; front_shiny: string | null };
    };
  };
  cries?: { latest: string | null; legacy: string | null };
  species: NamedResource;
}

export interface Species {
  id: number;
  name: string;
  gender_rate: number;
  capture_rate: number;
  base_happiness: number | null;
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
  egg_groups: NamedResource[];
  habitat: NamedResource | null;
  names: (Localized & { name: string })[];
  genera: (Localized & { genus: string })[];
  flavor_text_entries: (Localized & { flavor_text: string; version: NamedResource })[];
  evolution_chain: { url: string } | null;
  varieties: { is_default: boolean; pokemon: NamedResource }[];
}

export interface EvolutionDetail {
  is_default?: boolean;
  trigger: NamedResource;
  item: NamedResource | null;
  held_item: NamedResource | null;
  known_move: NamedResource | null;
  known_move_type: NamedResource | null;
  location: NamedResource | null;
  min_level: number | null;
  min_happiness: number | null;
  min_affection: number | null;
  min_beauty: number | null;
  time_of_day: string;
  gender: number | null;
  needs_overworld_rain: boolean;
  party_species: NamedResource | null;
  party_type: NamedResource | null;
  relative_physical_stats: number | null;
  trade_species: NamedResource | null;
  turn_upside_down: boolean;
}

export interface ChainLink {
  species: NamedResource;
  evolution_details: EvolutionDetail[];
  evolves_to: ChainLink[];
}

export interface EvolutionChain {
  id: number;
  chain: ChainLink;
}

export interface Ability {
  name: string;
  effect_entries: (Localized & { short_effect: string })[];
  flavor_text_entries: (Localized & { flavor_text: string })[];
}

// ---------------------------------------------------------------------------
// Fetching with in-memory de-duplication
// ---------------------------------------------------------------------------

const requests = new Map<string, Promise<unknown>>();

/** GET a PokéAPI path (or absolute URL). Concurrent and repeat calls share one request. */
export function fetchJSON<T>(pathOrUrl: string): Promise<T> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API}/${pathOrUrl}`;
  let request = requests.get(url);
  if (!request) {
    request = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`PokéAPI responded with ${res.status} for ${url}`);
      return res.json();
    });
    // Forget failures so a retry actually hits the network again.
    request.catch(() => requests.delete(url));
    requests.set(url, request);
  }
  return request as Promise<T>;
}

// ---------------------------------------------------------------------------
// The Pokédex index: every species with its types, plus the full type chart.
// Built from 19 requests (species list + one per type) and cached locally.
// ---------------------------------------------------------------------------

export interface DexEntry {
  id: number;
  name: string;
  types: TypeName[];
}

export interface DexData {
  entries: DexEntry[];
  chart: TypeChart;
}

const CACHE_KEY = 'pokedex:index:v1';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function readCache(): DexData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { savedAt, data } = JSON.parse(raw) as { savedAt: number; data: DexData };
    if (Date.now() - savedAt > CACHE_TTL_MS || !data?.entries?.length) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data: DexData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Storage full or unavailable (private mode): the app still works, it just refetches next visit.
  }
}

export async function loadDexData(): Promise<DexData> {
  const cached = readCache();
  if (cached) return cached;

  const [species, typeResponses] = await Promise.all([
    fetchJSON<NamedList>('pokemon-species?limit=2000'),
    Promise.all(TYPES.map((t) => fetchJSON<TypeResponse>(`type/${t}`))),
  ]);

  const data = buildDexData(species, typeResponses);
  writeCache(data);
  return data;
}

/** Combine the species list and per-type responses into the index and the type chart. */
export function buildDexData(species: NamedList, typeResponses: TypeResponse[]): DexData {
  const chart = {} as TypeChart;
  const typesById = new Map<number, TypeName[]>();

  for (const res of typeResponses) {
    const attacker = res.name as TypeName;
    const row = Object.fromEntries(TYPES.map((t) => [t, 1])) as Record<TypeName, number>;
    const rel = res.damage_relations;
    for (const { name } of rel.double_damage_to) if (isTypeName(name)) row[name] = 2;
    for (const { name } of rel.half_damage_to) if (isTypeName(name)) row[name] = 0.5;
    for (const { name } of rel.no_damage_to) if (isTypeName(name)) row[name] = 0;
    chart[attacker] = row;

    for (const { slot, pokemon } of res.pokemon) {
      const id = idFromUrl(pokemon.url);
      const list = typesById.get(id) ?? [];
      list[slot - 1] = attacker;
      typesById.set(id, list);
    }
  }

  const entries = species.results
    .map((r) => {
      const id = idFromUrl(r.url);
      return { id, name: r.name, types: (typesById.get(id) ?? []).filter(Boolean) };
    })
    .sort((a, b) => a.id - b.id);

  return { entries, chart };
}

// ---------------------------------------------------------------------------
// Small helpers for localized fields
// ---------------------------------------------------------------------------

export function english<T extends Localized>(entries: T[]): T | undefined {
  return entries.find((e) => e.language.name === 'en');
}

export function latestEnglish<T extends Localized>(entries: T[]): T | undefined {
  return entries.findLast((e) => e.language.name === 'en');
}
