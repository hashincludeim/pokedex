import type { CSSProperties } from 'react';
import type { Pokemon } from '../lib/api';

const LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

const MAX_STAT = 255;

function statColor(value: number): string {
  if (value < 50) return '#f87171';
  if (value < 80) return '#fb923c';
  if (value < 100) return '#facc15';
  if (value < 120) return '#a3e635';
  if (value < 150) return '#34d399';
  return '#22d3ee';
}

export function StatBars({ stats }: { stats: Pokemon['stats'] }) {
  const total = stats.reduce((sum, s) => sum + s.base_stat, 0);
  return (
    <div className="stats">
      {stats.map((s) => (
        <div className="stat" key={s.stat.name}>
          <span className="stat__label">{LABELS[s.stat.name] ?? s.stat.name}</span>
          <span className="stat__value">{s.base_stat}</span>
          <div className="stat__track">
            <div
              className="stat__bar"
              style={
                {
                  width: `${Math.min(100, (s.base_stat / MAX_STAT) * 100)}%`,
                  '--bar': statColor(s.base_stat),
                } as CSSProperties
              }
            />
          </div>
        </div>
      ))}
      <div className="stat stat--total">
        <span className="stat__label">Total</span>
        <span className="stat__value">{total}</span>
        <span className="stat__hint">Base stat total</span>
      </div>
    </div>
  );
}
