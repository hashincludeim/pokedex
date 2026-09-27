import { memo, type CSSProperties, type MouseEvent } from 'react';
import type { DexEntry } from '../lib/api';
import { artworkUrl, formatId, formatName } from '../lib/format';
import { openPokemon } from '../lib/router';
import { TYPE_COLORS } from '../lib/types';
import { Artwork } from './Artwork';
import { TypeBadge } from './TypeBadge';

export function typeGradientVars(types: DexEntry['types']): CSSProperties {
  const c1 = TYPE_COLORS[types[0] ?? 'normal'];
  const c2 = TYPE_COLORS[types[1] ?? types[0] ?? 'normal'];
  return { '--c1': c1, '--c2': c2 } as CSSProperties;
}

/** Plain left-clicks open the in-app detail view; modified clicks keep normal link behavior. */
export function handlePokemonLink(e: MouseEvent, id: number) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  openPokemon(id);
}

export const PokemonCard = memo(function PokemonCard({ entry }: { entry: DexEntry }) {
  const name = formatName(entry.name);
  return (
    <a
      className="poke-card"
      href={`#/pokemon/${entry.id}`}
      style={typeGradientVars(entry.types)}
      onClick={(e) => handlePokemonLink(e, entry.id)}
    >
      <span className="poke-card__watermark" aria-hidden="true">
        {entry.id}
      </span>
      <div className="poke-card__art">
        <Artwork src={artworkUrl(entry.id)} alt={name} />
      </div>
      <div className="poke-card__body">
        <span className="poke-card__id">{formatId(entry.id)}</span>
        <h3 className="poke-card__name">{name}</h3>
        <div className="poke-card__types">
          {entry.types.map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </div>
      </div>
    </a>
  );
});

export function PokemonCardSkeleton() {
  return (
    <div className="poke-card poke-card--skeleton" aria-hidden="true">
      <div className="poke-card__art">
        <div className="skeleton skeleton--circle" />
      </div>
      <div className="poke-card__body">
        <div className="skeleton skeleton--line" style={{ width: '35%' }} />
        <div className="skeleton skeleton--line" style={{ width: '70%', height: 18 }} />
        <div className="skeleton skeleton--line" style={{ width: '50%' }} />
      </div>
    </div>
  );
}
