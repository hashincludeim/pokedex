import { describe, expect, it } from 'vitest';
import { CHART } from '../test/fixtures';
import { MULTIPLIERS, TYPES, bestAttack, defensiveProfile, effectiveness, formatMultiplier, textColorOn } from './types';

describe('effectiveness', () => {
  it('multiplies across both defending types', () => {
    expect(effectiveness(CHART, 'fire', ['grass', 'steel'])).toBe(4);
    expect(effectiveness(CHART, 'ice', ['dragon', 'flying'])).toBe(4);
    expect(effectiveness(CHART, 'water', ['fire', 'water'])).toBe(1);
    expect(effectiveness(CHART, 'grass', ['fire', 'flying'])).toBe(0.25);
  });

  it('is zero when either type is immune', () => {
    expect(effectiveness(CHART, 'ground', ['fire', 'flying'])).toBe(0);
    expect(effectiveness(CHART, 'fighting', ['normal', 'ghost'])).toBe(0);
  });

  it('is neutral with no defenders', () => {
    expect(effectiveness(CHART, 'fire', [])).toBe(1);
  });
});

describe('defensiveProfile', () => {
  it('groups every attacking type for a dual typing', () => {
    const profile = defensiveProfile(CHART, ['grass', 'poison']);
    expect(profile.get(4)).toEqual([]);
    expect(profile.get(2)).toEqual(['fire', 'ice', 'flying', 'psychic']);
    expect(profile.get(0.5)).toEqual(['water', 'electric', 'fighting', 'fairy']);
    expect(profile.get(0.25)).toEqual(['grass']);
    expect(profile.get(0)).toEqual([]);
  });

  it('finds 4× weaknesses and immunities', () => {
    const profile = defensiveProfile(CHART, ['fire', 'flying']);
    expect(profile.get(4)).toEqual(['rock']);
    expect(profile.get(0)).toEqual(['ground']);
  });

  it('places each attacking type in exactly one group', () => {
    const profile = defensiveProfile(CHART, ['water', 'ground']);
    expect([...profile.keys()]).toEqual([...MULTIPLIERS]);
    expect([...profile.values()].flat().sort()).toEqual([...TYPES].sort());
  });

  it('returns empty groups with no defenders', () => {
    expect([...defensiveProfile(CHART, []).values()].flat()).toEqual([]);
  });
});

describe('bestAttack', () => {
  it('takes the best multiplier among the attacking types', () => {
    expect(bestAttack(CHART, ['ground', 'ice'], ['water', 'flying'])).toBe(1);
    expect(bestAttack(CHART, ['ground', 'ice'], ['dragon', 'ground'])).toBe(4);
    expect(bestAttack(CHART, ['normal', 'fighting'], ['ghost'])).toBe(0);
  });

  it('is zero with no attacking types', () => {
    expect(bestAttack(CHART, [], ['fire'])).toBe(0);
  });
});

describe('formatMultiplier', () => {
  it('uses fraction glyphs for halves and quarters', () => {
    expect(MULTIPLIERS.map(formatMultiplier)).toEqual(['4×', '2×', '1×', '½×', '¼×', '0×']);
  });
});

describe('textColorOn', () => {
  it('picks dark text on light colors and white on dark ones', () => {
    expect(textColorOn('#F7D02C')).toBe('#1b1c22');
    expect(textColorOn('#C22E28')).toBe('#ffffff');
  });
});
