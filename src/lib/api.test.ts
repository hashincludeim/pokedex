import { describe, expect, it } from 'vitest';
import { buildDexData, type TypeResponse } from './api';

const API = 'https://pokeapi.co/api/v2';
const species = (id: number, name: string) => ({ name, url: `${API}/pokemon-species/${id}/` });
const pokemon = (id: number, name: string, slot: number) => ({ slot, pokemon: { name, url: `${API}/pokemon/${id}/` } });
const refs = (...names: string[]) => names.map((name) => ({ name, url: `${API}/type/${name}/` }));

function typeResponse(name: string, relations: Partial<TypeResponse['damage_relations']>, mons: TypeResponse['pokemon']) {
  return {
    name,
    damage_relations: { double_damage_to: [], half_damage_to: [], no_damage_to: [], ...relations },
    pokemon: mons,
  };
}

describe('buildDexData', () => {
  const data = buildDexData(
    { count: 2, results: [species(4, 'charmander'), species(1, 'bulbasaur')] },
    [
      // Poison comes first here, but Bulbasaur's poison typing is its second slot.
      typeResponse('poison', { double_damage_to: refs('grass', 'fairy'), no_damage_to: refs('steel') }, [
        pokemon(1, 'bulbasaur', 2),
      ]),
      typeResponse('grass', { half_damage_to: refs('fire', 'grass'), double_damage_to: refs('water', 'stellar') }, [
        pokemon(1, 'bulbasaur', 1),
        pokemon(10033, 'venusaur-mega', 1),
      ]),
      typeResponse('fire', {}, [pokemon(4, 'charmander', 1)]),
    ],
  );

  it('lists species in number order with types in slot order', () => {
    expect(data.entries).toEqual([
      { id: 1, name: 'bulbasaur', types: ['grass', 'poison'] },
      { id: 4, name: 'charmander', types: ['fire'] },
    ]);
  });

  it('builds chart rows that default to neutral', () => {
    expect(data.chart.poison.grass).toBe(2);
    expect(data.chart.poison.steel).toBe(0);
    expect(data.chart.poison.normal).toBe(1);
    expect(data.chart.grass.fire).toBe(0.5);
  });

  it('ignores types the app does not know about', () => {
    expect(Object.keys(data.chart.grass)).not.toContain('stellar');
  });
});
