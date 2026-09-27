import { fetchJSON, type ChainLink, type EvolutionChain as Chain, type EvolutionDetail } from '../lib/api';
import { artworkUrl, formatId, formatName, idFromUrl, titleCase } from '../lib/format';
import { useAsync } from '../lib/hooks';
import { navigate } from '../lib/router';
import { Artwork } from './Artwork';
import { ArrowRightIcon } from './Icons';
import { ErrorState, Spinner } from './States';

const RELATIVE_STATS: Record<string, string> = { '1': 'Attack > Defense', '0': 'Attack = Defense', '-1': 'Attack < Defense' };

/** Turn PokéAPI's evolution conditions into a short human-readable phrase. */
function describeEvolution(details: EvolutionDetail[]): string {
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

function EvoMon({ link, currentId }: { link: ChainLink; currentId: number }) {
  const id = idFromUrl(link.species.url);
  const name = formatName(link.species.name);
  const isCurrent = id === currentId;
  return (
    <a
      className={`evo-mon ${isCurrent ? 'is-current' : ''}`}
      href={`#/pokemon/${id}`}
      aria-current={isCurrent ? 'page' : undefined}
      onClick={(e) => {
        e.preventDefault();
        if (!isCurrent) navigate(`/pokemon/${id}`, { replace: true });
      }}
    >
      <div className="evo-mon__art">
        <Artwork src={artworkUrl(id)} alt={name} />
      </div>
      <span className="evo-mon__id">{formatId(id)}</span>
      <span className="evo-mon__name">{name}</span>
    </a>
  );
}

function EvoBranch({ link, currentId }: { link: ChainLink; currentId: number }) {
  // Wide splits (Eevee, Tyrogue…) lay their branches out as a grid below the base form.
  const many = link.evolves_to.length >= 3;
  return (
    <div className={`evo-branch ${many ? 'evo-branch--many' : ''}`}>
      <EvoMon link={link} currentId={currentId} />
      {link.evolves_to.length > 0 && (
        <div className="evo-next">
          {link.evolves_to.map((child) => (
            <div className="evo-step" key={child.species.name}>
              <div className="evo-arrow">
                <ArrowRightIcon />
                <span>{describeEvolution(child.evolution_details)}</span>
              </div>
              <EvoBranch link={child} currentId={currentId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EvolutionChain({ url, currentId }: { url: string; currentId: number }) {
  const { data, error, loading, retry } = useAsync(() => fetchJSON<Chain>(url), [url]);

  if (error) return <ErrorState message="Couldn’t load the evolution chain." onRetry={retry} />;
  if (loading || !data) return <Spinner label="Loading evolutions…" />;
  if (data.chain.evolves_to.length === 0) {
    return (
      <div className="evo">
        <EvoMon link={data.chain} currentId={currentId} />
        <p className="muted">This Pokémon does not evolve.</p>
      </div>
    );
  }
  return (
    <div className="evo">
      <EvoBranch link={data.chain} currentId={currentId} />
    </div>
  );
}
