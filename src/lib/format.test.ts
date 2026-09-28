import { describe, expect, it } from 'vitest';
import { cleanFlavorText, formLabel, formatId, formatName, generationOf, idFromUrl } from './format';

describe('formatName', () => {
  it('title-cases slugs', () => {
    expect(formatName('charizard')).toBe('Charizard');
    expect(formatName('tapu-koko')).toBe('Tapu Koko');
  });

  it('uses the official spelling for special names', () => {
    expect(formatName('nidoran-f')).toBe('Nidoran♀');
    expect(formatName('mr-mime')).toBe('Mr. Mime');
    expect(formatName('farfetchd')).toBe('Farfetch’d');
    expect(formatName('type-null')).toBe('Type: Null');
  });
});

describe('formLabel', () => {
  it('names forms by their suffix', () => {
    expect(formLabel('charizard-mega-x', 'charizard', false)).toBe('Mega X');
    expect(formLabel('vulpix-alola', 'vulpix', false)).toBe('Alola');
  });

  it('calls the plain default variety "Default"', () => {
    expect(formLabel('pikachu', 'pikachu', true)).toBe('Default');
  });

  it('labels a default variety that has its own name', () => {
    expect(formLabel('deoxys-normal', 'deoxys', true)).toBe('Normal');
  });
});

describe('ids and generations', () => {
  it('pads ids to four digits', () => {
    expect(formatId(25)).toBe('#0025');
    expect(formatId(1025)).toBe('#1025');
  });

  it('reads the id from a resource URL', () => {
    expect(idFromUrl('https://pokeapi.co/api/v2/pokemon-species/25/')).toBe(25);
    expect(idFromUrl('https://pokeapi.co/api/v2/pokemon/10034')).toBe(10034);
    expect(idFromUrl('https://pokeapi.co/api/v2/type/')).toBeNaN();
  });

  it('finds the generation for a national number', () => {
    expect(generationOf(151)?.region).toBe('Kanto');
    expect(generationOf(152)?.region).toBe('Johto');
    expect(generationOf(1025)?.region).toBe('Paldea');
    expect(generationOf(0)).toBeUndefined();
  });
});

describe('cleanFlavorText', () => {
  it('turns form feeds and line breaks into spaces', () => {
    expect(cleanFlavorText('A strange seed was\fplanted on its\nback at birth. ')).toBe(
      'A strange seed was planted on its back at birth.',
    );
  });

  it('rejoins words split by a soft hyphen at a line break', () => {
    expect(cleanFlavorText('It can evolu­\ntion quickly.')).toBe('It can evolution quickly.');
  });
});
