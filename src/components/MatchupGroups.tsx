import { defensiveProfile, formatMultiplier, type TypeChart, type TypeName } from '../lib/types';
import { TypeBadge } from './TypeBadge';

const ROWS = [
  { m: 4, label: 'Very weak', tone: 'weak-4' },
  { m: 2, label: 'Weak', tone: 'weak-2' },
  { m: 1, label: 'Neutral', tone: 'neutral' },
  { m: 0.5, label: 'Resists', tone: 'resist-2' },
  { m: 0.25, label: 'Strongly resists', tone: 'resist-4' },
  { m: 0, label: 'Immune', tone: 'immune' },
] as const;

interface MatchupGroupsProps {
  chart: TypeChart;
  defenders: readonly TypeName[];
  showNeutral?: boolean;
}

/** Damage taken from every attacking type, grouped by multiplier. */
export function MatchupGroups({ chart, defenders, showNeutral = false }: MatchupGroupsProps) {
  const profile = defensiveProfile(chart, defenders);
  const rows = ROWS.filter((r) => (r.m !== 1 || showNeutral) && (profile.get(r.m)?.length ?? 0) > 0);

  return (
    <div className="matchups">
      {rows.map((r) => (
        <div key={r.m} className={`matchup-row matchup-row--${r.tone}`}>
          <div className="matchup-row__label">
            <span className="matchup-row__mult">{formatMultiplier(r.m)}</span>
            <span className="matchup-row__text">{r.label}</span>
          </div>
          <div className="matchup-row__types">
            {profile.get(r.m)!.map((t) => (
              <TypeBadge key={t} type={t} size="sm" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
