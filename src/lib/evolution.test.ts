import { describe, expect, it } from 'vitest';
import type { EvolutionDetail } from './api';
import { describeEvolution } from './evolution';

const ref = (name: string) => ({ name, url: '' });

function detail(overrides: Partial<EvolutionDetail> = {}): EvolutionDetail {
  return {
    trigger: ref('level-up'),
    item: null,
    held_item: null,
    known_move: null,
    known_move_type: null,
    location: null,
    min_level: null,
    min_happiness: null,
    min_affection: null,
    min_beauty: null,
    time_of_day: '',
    gender: null,
    needs_overworld_rain: false,
    party_species: null,
    party_type: null,
    relative_physical_stats: null,
    trade_species: null,
    turn_upside_down: false,
    ...overrides,
  };
}

describe('describeEvolution', () => {
  it('describes level and item evolutions', () => {
    expect(describeEvolution([detail({ min_level: 16 })])).toBe('Lv. 16');
    expect(describeEvolution([detail({ trigger: ref('use-item'), item: ref('thunder-stone') })])).toBe('Use Thunder Stone');
  });

  it('describes trades', () => {
    expect(describeEvolution([detail({ trigger: ref('trade'), held_item: ref('metal-coat') })])).toBe(
      'Trade, holding Metal Coat',
    );
    expect(describeEvolution([detail({ trigger: ref('trade'), trade_species: ref('shelmet') })])).toBe('Trade, for Shelmet');
  });

  it('combines friendship with time of day', () => {
    expect(describeEvolution([detail({ min_happiness: 160, time_of_day: 'day' })])).toBe('High friendship, during the day');
    expect(describeEvolution([detail({ min_happiness: 160, time_of_day: 'night' })])).toBe('High friendship, at night');
  });

  it('handles unusual conditions', () => {
    expect(describeEvolution([detail({ min_level: 20, relative_physical_stats: 0 })])).toBe('Lv. 20, Attack = Defense');
    expect(describeEvolution([detail({ min_level: 30, turn_upside_down: true })])).toBe(
      'Lv. 30, holding console upside down',
    );
    expect(describeEvolution([detail({ min_level: 22, party_species: ref('mr-mime') })])).toBe('Lv. 22, with Mr. Mime in party');
  });

  it('falls back to "Level up" when there are no conditions', () => {
    expect(describeEvolution([detail()])).toBe('Level up');
  });

  it('is empty for a base form', () => {
    expect(describeEvolution([])).toBe('');
  });

  it('prefers the method marked as default, then the latest one', () => {
    const old = detail({ location: ref('mt-coronet') });
    const current = detail({ trigger: ref('use-item'), item: ref('thunder-stone') });
    expect(describeEvolution([current, old].map((d, i) => ({ ...d, is_default: i === 0 })))).toBe('Use Thunder Stone');
    expect(describeEvolution([old, current])).toBe('Use Thunder Stone');
  });
});
