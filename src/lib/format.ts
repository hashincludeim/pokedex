const SPECIAL_NAMES: Record<string, string> = {
  'nidoran-f': 'Nidoran♀',
  'nidoran-m': 'Nidoran♂',
  'mr-mime': 'Mr. Mime',
  'mr-rime': 'Mr. Rime',
  'mime-jr': 'Mime Jr.',
  'ho-oh': 'Ho-Oh',
  'porygon-z': 'Porygon-Z',
  'type-null': 'Type: Null',
  'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o',
  farfetchd: 'Farfetch’d',
  sirfetchd: 'Sirfetch’d',
  flabebe: 'Flabébé',
  'wo-chien': 'Wo-Chien',
  'chien-pao': 'Chien-Pao',
  'ting-lu': 'Ting-Lu',
  'chi-yu': 'Chi-Yu',
};

export function titleCase(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

/** Display name for a species slug from PokéAPI (e.g. "mr-mime" → "Mr. Mime"). */
export function formatName(slug: string): string {
  return SPECIAL_NAMES[slug] ?? titleCase(slug);
}

export function formatId(id: number): string {
  return `#${String(id).padStart(4, '0')}`;
}

export function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : NaN;
}

const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export function artworkUrl(id: number, shiny = false): string {
  return `${SPRITES}/other/official-artwork/${shiny ? 'shiny/' : ''}${id}.png`;
}

export function spriteUrl(id: number): string {
  return `${SPRITES}/${id}.png`;
}

export interface Generation {
  id: number;
  numeral: string;
  region: string;
  start: number;
  end: number;
}

export const GENERATIONS: Generation[] = [
  { id: 1, numeral: 'I', region: 'Kanto', start: 1, end: 151 },
  { id: 2, numeral: 'II', region: 'Johto', start: 152, end: 251 },
  { id: 3, numeral: 'III', region: 'Hoenn', start: 252, end: 386 },
  { id: 4, numeral: 'IV', region: 'Sinnoh', start: 387, end: 493 },
  { id: 5, numeral: 'V', region: 'Unova', start: 494, end: 649 },
  { id: 6, numeral: 'VI', region: 'Kalos', start: 650, end: 721 },
  { id: 7, numeral: 'VII', region: 'Alola', start: 722, end: 809 },
  { id: 8, numeral: 'VIII', region: 'Galar', start: 810, end: 905 },
  { id: 9, numeral: 'IX', region: 'Paldea', start: 906, end: Infinity },
];

export function generationOf(id: number): Generation | undefined {
  return GENERATIONS.find((g) => id >= g.start && id <= g.end);
}

/** Strip the form-feed / soft-hyphen noise that PokéAPI flavor text carries over from the games. */
export function cleanFlavorText(text: string): string {
  return text
    .replace(/­\n/g, '')
    .replace(/[\f\n\r­]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
