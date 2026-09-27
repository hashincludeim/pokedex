export const TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export type TypeName = (typeof TYPES)[number];

/** chart[attacker][defender] = damage multiplier */
export type TypeChart = Record<TypeName, Record<TypeName, number>>;

export const TYPE_COLORS: Record<TypeName, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

export function isTypeName(value: string): value is TypeName {
  return (TYPES as readonly string[]).includes(value);
}

/** Pick readable text (dark or white) for a given background hex color. */
export function textColorOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.36 ? '#1b1c22' : '#ffffff';
}

/** Combined multiplier of one attacking type against one or two defending types. */
export function effectiveness(chart: TypeChart, attacker: TypeName, defenders: readonly TypeName[]): number {
  return defenders.reduce((m, d) => m * chart[attacker][d], 1);
}

export const MULTIPLIERS = [4, 2, 1, 0.5, 0.25, 0] as const;

export function formatMultiplier(m: number): string {
  if (m === 0.5) return '½×';
  if (m === 0.25) return '¼×';
  return `${m}×`;
}

/** Group every attacking type by how much damage it deals to the given defending types. */
export function defensiveProfile(chart: TypeChart, defenders: readonly TypeName[]): Map<number, TypeName[]> {
  const groups = new Map<number, TypeName[]>(MULTIPLIERS.map((m) => [m, []]));
  if (defenders.length === 0) return groups;
  for (const attacker of TYPES) {
    groups.get(effectiveness(chart, attacker, defenders))?.push(attacker);
  }
  return groups;
}

/** Best multiplier any of the attacking types achieves against the given defender(s). */
export function bestAttack(chart: TypeChart, attackers: readonly TypeName[], defenders: readonly TypeName[]): number {
  return attackers.reduce((best, a) => Math.max(best, effectiveness(chart, a, defenders)), 0);
}
