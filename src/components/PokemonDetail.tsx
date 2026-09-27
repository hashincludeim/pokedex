import { useEffect, useRef, useState } from 'react';
import { english, fetchJSON, latestEnglish, type Ability, type NamedResource, type Pokemon, type Species } from '../lib/api';
import { useDex } from '../lib/DexContext';
import { artworkUrl, cleanFlavorText, formatId, formatName, generationOf, titleCase } from '../lib/format';
import { useAsync } from '../lib/hooks';
import { closePokemon, navigate } from '../lib/router';
import { isTypeName, type TypeName } from '../lib/types';
import { Artwork } from './Artwork';
import { EvolutionChain } from './EvolutionChain';
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, SparklesIcon, VolumeIcon } from './Icons';
import { MatchupGroups } from './MatchupGroups';
import { typeGradientVars } from './PokemonCard';
import { StatBars } from './StatBars';
import { ErrorState, Spinner } from './States';
import { TypeBadge } from './TypeBadge';

type Tab = 'about' | 'stats' | 'matchups' | 'evolution';

const TABS: { id: Tab; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'stats', label: 'Base stats' },
  { id: 'matchups', label: 'Matchups' },
  { id: 'evolution', label: 'Evolution' },
];

/** "charizard-mega-x" on species "charizard" → "Mega X" */
function formLabel(varietyName: string, speciesName: string, isDefault: boolean): string {
  if (isDefault && varietyName === speciesName) return 'Default';
  const suffix = varietyName.startsWith(`${speciesName}-`) ? varietyName.slice(speciesName.length + 1) : varietyName;
  return titleCase(suffix);
}

export function PokemonDetail({ id }: { id: number }) {
  const { byId, data: dex } = useDex();
  const entry = byId.get(id);
  const maxId = dex?.entries.at(-1)?.id ?? id;
  const prevId = id > 1 ? id - 1 : null;
  const nextId = id < maxId ? id + 1 : null;

  const [tab, setTab] = useState<Tab>('about');
  const [shiny, setShiny] = useState(false);
  // Selected alternate form, remembered only for the species it belongs to.
  const [form, setForm] = useState<{ speciesId: number; name: string } | null>(null);
  const formName = form?.speciesId === id ? form.name : null;

  const speciesRes = useAsync(() => fetchJSON<Species>(`pokemon-species/${id}`), [id]);
  const pokemonKey = formName ?? String(id);
  const pokemonRes = useAsync(() => fetchJSON<Pokemon>(`pokemon/${pokemonKey}`), [pokemonKey]);

  // Ignore results still in flight from the previously viewed Pokémon.
  const species = speciesRes.data?.id === id ? speciesRes.data : undefined;
  const pokemon =
    pokemonRes.data && (pokemonRes.data.name === pokemonKey || String(pokemonRes.data.id) === pokemonKey)
      ? pokemonRes.data
      : undefined;

  const types: TypeName[] = pokemon
    ? pokemon.types.map((t) => t.type.name).filter(isTypeName)
    : (entry?.types ?? []);
  const name = (species && english(species.names)?.name) ?? formatName(entry?.name ?? '');
  const genus = species && english(species.genera)?.genus;
  const art = pokemon?.sprites.other?.['official-artwork'];
  const artSrc = (shiny ? art?.front_shiny : art?.front_default) ?? artworkUrl(id, shiny);

  // --- Modal behavior: focus, scroll lock, keyboard shortcuts ---------------
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePokemon();
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowLeft' && prevId) navigate(`/pokemon/${prevId}`, { replace: true });
      if (e.key === 'ArrowRight' && nextId) navigate(`/pokemon/${nextId}`, { replace: true });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevId, nextId]);

  useEffect(() => {
    dialogRef.current?.scrollTo({ top: 0 });
  }, [id]);

  const playCry = () => {
    const src = pokemon?.cries?.latest ?? pokemon?.cries?.legacy;
    if (!src) return;
    const audio = new Audio(src);
    audio.volume = 0.4;
    audio.play().catch(() => {
      /* Browser without Ogg support, or autoplay blocked. */
    });
  };

  const varieties = species?.varieties ?? [];
  const tag = species?.is_mythical ? 'Mythical' : species?.is_legendary ? 'Legendary' : species?.is_baby ? 'Baby' : null;

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && closePokemon()}>
      <div
        className="modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${name} details`}
        tabIndex={-1}
        ref={dialogRef}
        style={typeGradientVars(types)}
      >
        <div className="detail-hero">
          <div className="detail-hero__bar">
            <div className="detail-hero__nav">
              <button
                type="button"
                className="icon-button"
                disabled={!prevId}
                onClick={() => prevId && navigate(`/pokemon/${prevId}`, { replace: true })}
                aria-label="Previous Pokémon"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                className="icon-button"
                disabled={!nextId}
                onClick={() => nextId && navigate(`/pokemon/${nextId}`, { replace: true })}
                aria-label="Next Pokémon"
              >
                <ChevronRightIcon />
              </button>
            </div>
            <button type="button" className="icon-button" onClick={closePokemon} aria-label="Close">
              <CloseIcon />
            </button>
          </div>

          <span className="detail-hero__watermark" aria-hidden="true">
            {formatId(id).slice(1)}
          </span>

          <div className="detail-hero__art">
            <Artwork key={artSrc} src={artSrc} alt={name} eager />
          </div>

          <div className="detail-hero__info">
            <span className="detail-hero__id">
              {formatId(id)}
              {tag && <span className="pill">{tag}</span>}
            </span>
            <h2 className="detail-hero__name">{name}</h2>
            {genus && <p className="detail-hero__genus">{genus}</p>}
            <div className="detail-hero__types">
              {types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            <div className="detail-hero__actions">
              <button
                type="button"
                className={`chip-button ${shiny ? 'is-active' : ''}`}
                onClick={() => setShiny((s) => !s)}
                aria-pressed={shiny}
              >
                <SparklesIcon width={16} height={16} /> Shiny
              </button>
              <button type="button" className="chip-button" onClick={playCry} disabled={!pokemon?.cries?.latest}>
                <VolumeIcon width={16} height={16} /> Cry
              </button>
            </div>
          </div>
        </div>

        {varieties.length > 1 && species && (
          <div className="forms" role="group" aria-label="Forms">
            {varieties.map((v) => {
              const active = (formName ?? species.varieties.find((x) => x.is_default)?.pokemon.name) === v.pokemon.name;
              return (
                <button
                  key={v.pokemon.name}
                  type="button"
                  className={`form-chip ${active ? 'is-active' : ''}`}
                  onClick={() => setForm(v.is_default ? null : { speciesId: id, name: v.pokemon.name })}
                  aria-pressed={active}
                >
                  {formLabel(v.pokemon.name, species.name, v.is_default)}
                </button>
              );
            })}
          </div>
        )}

        <nav className="tabs" role="tablist" aria-label="Pokémon details">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`tab ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="detail-body" role="tabpanel">
          {tab === 'about' && <AboutTab pokemon={pokemon} species={species} error={pokemonRes.error ?? speciesRes.error} retry={() => { pokemonRes.retry(); speciesRes.retry(); }} />}
          {tab === 'stats' &&
            (pokemon ? (
              <StatBars key={pokemon.name} stats={pokemon.stats} />
            ) : pokemonRes.error ? (
              <ErrorState message="Couldn’t load stats." onRetry={pokemonRes.retry} />
            ) : (
              <Spinner />
            ))}
          {tab === 'matchups' && dex && (
            <div className="detail-matchups">
              <p className="muted">
                Damage {name} takes from each attacking type, based on its {types.length === 2 ? 'dual typing' : 'type'}.
              </p>
              <MatchupGroups chart={dex.chart} defenders={types} />
              <a className="button button--ghost" href={`#/types?def=${types.join(',')}`}>
                Open in type calculator <ArrowRightIcon width={16} height={16} />
              </a>
            </div>
          )}
          {tab === 'evolution' &&
            (species?.evolution_chain ? (
              <EvolutionChain url={species.evolution_chain.url} currentId={id} />
            ) : speciesRes.error ? (
              <ErrorState message="Couldn’t load species data." onRetry={speciesRes.retry} />
            ) : species ? (
              <p className="muted">No evolution data available.</p>
            ) : (
              <Spinner />
            ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface AboutTabProps {
  pokemon: Pokemon | undefined;
  species: Species | undefined;
  error: Error | undefined;
  retry: () => void;
}

function AboutTab({ pokemon, species, error, retry }: AboutTabProps) {
  if (error) return <ErrorState message="Couldn’t load this Pokémon." onRetry={retry} />;
  if (!pokemon || !species) return <Spinner />;

  const flavor = latestEnglish(species.flavor_text_entries);
  const gen = generationOf(species.id);
  const heightM = pokemon.height / 10;
  const weightKg = pokemon.weight / 10;
  const feet = Math.floor(heightM * 3.28084);
  const inches = Math.round((heightM * 3.28084 - feet) * 12);

  return (
    <div className="about">
      {flavor && (
        <blockquote className="flavor">
          <p>{cleanFlavorText(flavor.flavor_text)}</p>
          <cite>Pokémon {titleCase(flavor.version.name)}</cite>
        </blockquote>
      )}

      <dl className="facts">
        <div className="fact">
          <dt>Height</dt>
          <dd>
            {heightM.toFixed(1)} m <span className="muted">({feet}′{String(inches).padStart(2, '0')}″)</span>
          </dd>
        </div>
        <div className="fact">
          <dt>Weight</dt>
          <dd>
            {weightKg.toFixed(1)} kg <span className="muted">({(weightKg * 2.20462).toFixed(1)} lbs)</span>
          </dd>
        </div>
        <div className="fact">
          <dt>Catch rate</dt>
          <dd>{species.capture_rate}</dd>
        </div>
        <div className="fact">
          <dt>Base exp.</dt>
          <dd>{pokemon.base_experience ?? '—'}</dd>
        </div>
        <div className="fact">
          <dt>Egg groups</dt>
          <dd>{species.egg_groups.map((g) => titleCase(g.name).replace(/(\D)(\d)/, '$1 $2')).join(', ') || '—'}</dd>
        </div>
        <div className="fact">
          <dt>Region</dt>
          <dd>{gen ? `${gen.region} · Gen ${gen.numeral}` : '—'}</dd>
        </div>
        <div className="fact fact--wide">
          <dt>Gender</dt>
          <dd>
            <GenderRatio rate={species.gender_rate} />
          </dd>
        </div>
      </dl>

      <h3 className="section-title">Abilities</h3>
      <ul className="abilities">
        {pokemon.abilities.map((a) => (
          <AbilityItem key={`${a.slot}-${a.ability.name}`} ability={a.ability} hidden={a.is_hidden} />
        ))}
      </ul>
    </div>
  );
}

function GenderRatio({ rate }: { rate: number }) {
  if (rate === -1) return <span>Genderless</span>;
  const female = (rate / 8) * 100;
  const male = 100 - female;
  return (
    <div className="gender">
      <div className="gender__bar" aria-hidden="true">
        <span className="gender__male" style={{ width: `${male}%` }} />
        <span className="gender__female" style={{ width: `${female}%` }} />
      </div>
      <div className="gender__labels">
        <span className="gender__label--male">♂ {male}%</span>
        <span className="gender__label--female">♀ {female}%</span>
      </div>
    </div>
  );
}

function AbilityItem({ ability, hidden }: { ability: NamedResource; hidden: boolean }) {
  const { data } = useAsync(() => fetchJSON<Ability>(ability.url), [ability.url]);
  const description = data
    ? (latestEnglish(data.flavor_text_entries)?.flavor_text ?? english(data.effect_entries)?.short_effect)
    : undefined;
  return (
    <li className="ability">
      <div className="ability__name">
        {titleCase(ability.name)}
        {hidden && <span className="pill pill--muted">Hidden</span>}
      </div>
      <p className="ability__desc">{description ? cleanFlavorText(description) : data ? '' : '…'}</p>
    </li>
  );
}
