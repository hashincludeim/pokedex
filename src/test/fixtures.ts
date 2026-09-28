import type { DexEntry } from '../lib/api';
import { TYPES, type TypeChart, type TypeName } from '../lib/types';

type Relations = { double?: TypeName[]; half?: TypeName[]; none?: TypeName[] };

// The current (Gen 6+) type chart, as attacker → defenders.
const RELATIONS: Record<TypeName, Relations> = {
  normal: { half: ['rock', 'steel'], none: ['ghost'] },
  fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'] },
  water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'] },
  electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], none: ['ground'] },
  grass: { double: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
  ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'] },
  fighting: {
    double: ['normal', 'ice', 'rock', 'dark', 'steel'],
    half: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    none: ['ghost'],
  },
  poison: { double: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], none: ['steel'] },
  ground: { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], none: ['flying'] },
  flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'] },
  psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], none: ['dark'] },
  bug: { double: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'] },
  rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'] },
  ghost: { double: ['psychic', 'ghost'], half: ['dark'], none: ['normal'] },
  dragon: { double: ['dragon'], half: ['steel'], none: ['fairy'] },
  dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'] },
  steel: { double: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'] },
  fairy: { double: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'] },
};

export const CHART = Object.fromEntries(
  TYPES.map((attacker) => {
    const { double = [], half = [], none = [] } = RELATIONS[attacker];
    const row = Object.fromEntries(TYPES.map((d) => [d, 1])) as Record<TypeName, number>;
    for (const d of double) row[d] = 2;
    for (const d of half) row[d] = 0.5;
    for (const d of none) row[d] = 0;
    return [attacker, row];
  }),
) as TypeChart;

export const ENTRIES: DexEntry[] = [
  { id: 1, name: 'bulbasaur', types: ['grass', 'poison'] },
  { id: 4, name: 'charmander', types: ['fire'] },
  { id: 6, name: 'charizard', types: ['fire', 'flying'] },
  { id: 25, name: 'pikachu', types: ['electric'] },
  { id: 83, name: 'farfetchd', types: ['normal', 'flying'] },
  { id: 122, name: 'mr-mime', types: ['psychic', 'fairy'] },
  { id: 250, name: 'ho-oh', types: ['fire', 'flying'] },
  { id: 255, name: 'torchic', types: ['fire'] },
  { id: 906, name: 'sprigatito', types: ['grass'] },
];
