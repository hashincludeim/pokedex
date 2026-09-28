import type { EvolutionDetail } from './api';
import { formatName, titleCase } from './format';

const RELATIVE_STATS: Record<string, string> = { '1': 'Attack > Defense', '0': 'Attack = Defense', '-1': 'Attack < Defense' };

/** Turn PokéAPI's evolution conditions into a short human-readable phrase. */
export function describeEvolution(details: EvolutionDetail[]): string {
  if (details.length === 0) return '';
  // Chains list a method per game; prefer the one PokéAPI marks as current.
  const d = details.find((x) => x.is_default) ?? details[details.length - 1];
  const parts: string[] = [];
  const trigger = d.trigger.name;

  if (trigger === 'level-up') {
    if (d.min_level) parts.push(`Lv. ${d.min_level}`);
  } else if (trigger === 'use-item') {
    parts.push(d.item ? `Use ${titleCase(d.item.name)}` : 'Use item');
  } else {
    parts.push(titleCase(trigger));
  }

  if (d.held_item) parts.push(`holding ${titleCase(d.held_item.name)}`);
  if (d.trade_species) parts.push(`for ${formatName(d.trade_species.name)}`);
  if (d.min_happiness) parts.push('high friendship');
  if (d.min_affection) parts.push('high affection');
  if (d.min_beauty) parts.push('high beauty');
  if (d.known_move) parts.push(`knowing ${titleCase(d.known_move.name)}`);
  if (d.known_move_type) parts.push(`knowing a ${titleCase(d.known_move_type.name)} move`);
  if (d.location) parts.push(`at ${titleCase(d.location.name)}`);
  if (d.party_species) parts.push(`with ${formatName(d.party_species.name)} in party`);
  if (d.party_type) parts.push(`with a ${titleCase(d.party_type.name)} type in party`);
  if (d.relative_physical_stats != null) parts.push(RELATIVE_STATS[String(d.relative_physical_stats)]);
  if (d.gender === 1) parts.push('female');
  if (d.gender === 2) parts.push('male');
  if (d.needs_overworld_rain) parts.push('in rain');
  if (d.turn_upside_down) parts.push('holding console upside down');
  if (d.time_of_day) parts.push(d.time_of_day === 'day' ? 'during the day' : `at ${d.time_of_day}`);

  if (parts.length === 0) return 'Level up';
  const text = parts.join(', ');
  return text[0].toUpperCase() + text.slice(1);
}
