import { fetchJSON, type ChainLink, type EvolutionChain as Chain } from '../lib/api';
import { describeEvolution } from '../lib/evolution';
import { artworkUrl, formatId, formatName, idFromUrl } from '../lib/format';
import { useAsync } from '../lib/hooks';
import { navigate } from '../lib/router';
import { Artwork } from './Artwork';
import { ArrowRightIcon } from './Icons';
import { ErrorState, Spinner } from './States';

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
