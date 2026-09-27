import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { DexEntry } from '../lib/api';
import { useDex } from '../lib/DexContext';
import { artworkUrl, formatId, formatName, spriteUrl } from '../lib/format';
import { replaceUrlQuietly } from '../lib/router';
import { TYPES, bestAttack, formatMultiplier, isTypeName, type TypeName } from '../lib/types';
import { Artwork } from './Artwork';
import { CloseIcon, ShieldIcon, SwordIcon } from './Icons';
import { MatchupGroups } from './MatchupGroups';
import { handlePokemonLink, typeGradientVars } from './PokemonCard';
import { PokemonPicker } from './PokemonPicker';
import { ErrorState, Spinner } from './States';
import { TypeBadge } from './TypeBadge';
import { TypeChartGrid } from './TypeChartGrid';

type Mode = 'defense' | 'attack';

const MAX_DEFENDING = 2;
const MAX_ATTACKING = 4;

function parseTypes(value: string | null, max: number): TypeName[] {
  return [...new Set((value ?? '').split(',').filter(isTypeName))].slice(0, max);
}

/** Toggle a type in a capped selection, dropping the oldest pick when full. */
function toggle(list: TypeName[], type: TypeName, max: number): TypeName[] {
  return list.includes(type) ? list.filter((t) => t !== type) : [...list, type].slice(-max);
}

const sameTyping = (a: readonly TypeName[], b: readonly TypeName[]) =>
  a.length === b.length && a.every((t) => b.includes(t));

export function TypeCalculator({ query }: { query: URLSearchParams }) {
  const { data, error, loading, retry, byId } = useDex();

  const [mode, setMode] = useState<Mode>(() => (query.has('atk') ? 'attack' : 'defense'));
  const [defending, setDefending] = useState<TypeName[]>(() => parseTypes(query.get('def'), MAX_DEFENDING));
  const [attacking, setAttacking] = useState<TypeName[]>(() => parseTypes(query.get('atk'), MAX_ATTACKING));
  const [pokemonId, setPokemonId] = useState<number | null>(() => Number(query.get('mon')) || null);

  // Keep the URL shareable without adding history entries on every click.
  useEffect(() => {
    const params = new URLSearchParams();
    if (mode === 'defense') {
      if (defending.length) params.set('def', defending.join(','));
      if (pokemonId) params.set('mon', String(pokemonId));
    } else {
      params.set('atk', attacking.join(','));
    }
    const qs = params.toString().replace(/%2C/g, ',');
    replaceUrlQuietly(`/types${qs ? `?${qs}` : ''}`);
  }, [mode, defending, attacking, pokemonId]);

  const pickPokemon = (entry: DexEntry) => {
    setPokemonId(entry.id);
    setDefending(entry.types);
  };

  const toggleDefending = (t: TypeName) => {
    setPokemonId(null);
    setDefending((list) => toggle(list, t, MAX_DEFENDING));
  };

  const pokemon = pokemonId ? byId.get(pokemonId) : undefined;

  return (
    <section className="calc">
      <header className="page-header">
        <div>
          <h1>Type matchups</h1>
          <p className="page-header__sub">See what a typing is weak to, or check how well your moves cover the field.</p>
        </div>
        <div className="segmented" role="tablist" aria-label="Calculator mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'defense'}
            className={mode === 'defense' ? 'is-active' : ''}
            onClick={() => setMode('defense')}
          >
            <ShieldIcon width={16} height={16} /> Defense
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'attack'}
            className={mode === 'attack' ? 'is-active' : ''}
            onClick={() => setMode('attack')}
          >
            <SwordIcon width={16} height={16} /> Attack
          </button>
        </div>
      </header>

      {error ? (
        <ErrorState message="Couldn’t load type data from PokéAPI." onRetry={retry} />
      ) : loading || !data ? (
        <Spinner label="Loading type chart…" />
      ) : (
        <>
          <div className="calc-grid">
            {mode === 'defense' ? (
              <>
                <div className="panel">
                  <h2 className="panel__title">Defending Pokémon</h2>
                  <p className="panel__hint">Search for a Pokémon, or pick up to two types.</p>
                  <PokemonPicker entries={data.entries} onPick={pickPokemon} />
                  <div className="type-picker" role="group" aria-label="Defending types">
                    {TYPES.map((t) => (
                      <TypeBadge
                        key={t}
                        type={t}
                        onClick={() => toggleDefending(t)}
                        selected={defending.includes(t)}
                        dimmed={defending.length > 0 && !defending.includes(t)}
                      />
                    ))}
                  </div>
                </div>

                <div className="panel panel--result">
                  {defending.length === 0 ? (
                    <EmptyResult text="Pick a type or Pokémon to see its weaknesses and resistances." />
                  ) : (
                    <>
                      <div className="result-head">
                        {pokemon && sameTyping(pokemon.types, defending) ? (
                          <SelectedPokemon entry={pokemon} onClear={() => setPokemonId(null)} />
                        ) : (
                          <div className="result-head__types">
                            {defending.map((t) => (
                              <TypeBadge key={t} type={t} />
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => {
                            setDefending([]);
                            setPokemonId(null);
                          }}
                        >
                          Clear
                        </button>
                      </div>
                      <MatchupGroups chart={data.chart} defenders={defending} showNeutral />
                      <SharedTyping entries={data.entries} types={defending} />
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="panel">
                  <h2 className="panel__title">Your move types</h2>
                  <p className="panel__hint">Pick up to four attacking types — like a moveset — to check coverage.</p>
                  <div className="type-picker" role="group" aria-label="Attacking types">
                    {TYPES.map((t) => (
                      <TypeBadge
                        key={t}
                        type={t}
                        onClick={() => setAttacking((list) => toggle(list, t, MAX_ATTACKING))}
                        selected={attacking.includes(t)}
                        dimmed={attacking.length > 0 && !attacking.includes(t)}
                      />
                    ))}
                  </div>
                </div>

                <div className="panel panel--result">
                  {attacking.length === 0 ? (
                    <EmptyResult text="Pick one or more move types to see what they hit hard." />
                  ) : (
                    <AttackResult attacking={attacking} onClear={() => setAttacking([])} />
                  )}
                </div>
              </>
            )}
          </div>

          <section className="panel chart-panel">
            <div className="chart-panel__head">
              <div>
                <h2 className="panel__title">Complete type chart</h2>
                <p className="panel__hint">Rows are the attacking move’s type; columns are the defending Pokémon’s type.</p>
              </div>
              <div className="legend">
                <span className="legend__item">
                  <i className="cell--super" /> 2× Super effective
                </span>
                <span className="legend__item">
                  <i className="cell--weak" /> ½× Not very effective
                </span>
                <span className="legend__item">
                  <i className="cell--none" /> 0× No effect
                </span>
              </div>
            </div>
            <TypeChartGrid
              chart={data.chart}
              highlightRows={mode === 'attack' ? attacking : []}
              highlightCols={mode === 'defense' ? defending : []}
            />
          </section>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

function EmptyResult({ text }: { text: string }) {
  return (
    <div className="result-empty">
      <div className="result-empty__orb" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

function SelectedPokemon({ entry, onClear }: { entry: DexEntry; onClear: () => void }) {
  return (
    <div className="selected-mon" style={typeGradientVars(entry.types)}>
      <div className="selected-mon__art">
        <Artwork src={artworkUrl(entry.id)} alt="" />
      </div>
      <div>
        <a className="selected-mon__name" href={`#/pokemon/${entry.id}`} onClick={(e) => handlePokemonLink(e, entry.id)}>
          {formatName(entry.name)}
        </a>
        <div className="selected-mon__types">
          <span className="muted">{formatId(entry.id)}</span>
          {entry.types.map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </div>
      </div>
      <button type="button" className="icon-button icon-button--sm" onClick={onClear} aria-label="Unselect Pokémon">
        <CloseIcon width={16} height={16} />
      </button>
    </div>
  );
}

function MonAvatars({ entries, total }: { entries: DexEntry[]; total: number }) {
  return (
    <div className="avatars">
      {entries.map((e) => (
        <a
          key={e.id}
          className="avatar"
          href={`#/pokemon/${e.id}`}
          onClick={(ev) => handlePokemonLink(ev, e.id)}
          title={formatName(e.name)}
        >
          <Artwork src={spriteUrl(e.id)} alt={formatName(e.name)} />
        </a>
      ))}
      {total > entries.length && <span className="avatars__more">+{total - entries.length}</span>}
    </div>
  );
}

function SharedTyping({ entries, types }: { entries: DexEntry[]; types: TypeName[] }) {
  const matches = useMemo(() => entries.filter((e) => sameTyping(e.types, types)), [entries, types]);
  return (
    <div className="shared-typing">
      <h3 className="section-title">
        {matches.length === 0
          ? 'No Pokémon has exactly this typing'
          : `${matches.length} Pokémon ${matches.length === 1 ? 'has' : 'have'} this exact typing`}
      </h3>
      {matches.length > 0 && <MonAvatars entries={matches.slice(0, 14)} total={matches.length} />}
    </div>
  );
}

const ATTACK_ROWS = [
  { m: 2, label: 'Super effective', tone: 'good' },
  { m: 1, label: 'Neutral', tone: 'neutral' },
  { m: 0.5, label: 'Not very effective', tone: 'bad' },
  { m: 0, label: 'No effect', tone: 'immune' },
] as const;

const COVERAGE = [
  { key: 'super', label: 'Super effective', color: 'var(--good)' },
  { key: 'neutral', label: 'Neutral', color: 'var(--neutral-bar)' },
  { key: 'resisted', label: 'Resisted', color: 'var(--bad)' },
  { key: 'immune', label: 'Immune', color: 'var(--immune)' },
] as const;

type CoverageKey = (typeof COVERAGE)[number]['key'];

function AttackResult({ attacking, onClear }: { attacking: TypeName[]; onClear: () => void }) {
  const { data } = useDex();
  const chart = data!.chart;
  const entries = data!.entries;

  // Best multiplier against each single defending type.
  const vsTypes = new Map<number, TypeName[]>(ATTACK_ROWS.map((r) => [r.m, []]));
  for (const d of TYPES) vsTypes.get(bestAttack(chart, attacking, [d]))?.push(d);

  // Best multiplier against every real Pokémon (so dual types are counted properly).
  const coverage = useMemo(() => {
    const buckets: Record<CoverageKey, DexEntry[]> = { super: [], neutral: [], resisted: [], immune: [] };
    for (const e of entries) {
      const m = bestAttack(chart, attacking, e.types);
      const key: CoverageKey = m >= 2 ? 'super' : m === 1 ? 'neutral' : m > 0 ? 'resisted' : 'immune';
      buckets[key].push(e);
    }
    return buckets;
  }, [chart, entries, attacking]);

  const walls = [...coverage.immune, ...coverage.resisted].sort((a, b) => a.id - b.id);

  return (
    <>
      <div className="result-head">
        <div className="result-head__types">
          {attacking.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
        <button type="button" className="link-button" onClick={onClear}>
          Clear
        </button>
      </div>

      <div className="matchups">
        {ATTACK_ROWS.filter((r) => vsTypes.get(r.m)!.length > 0).map((r) => (
          <div key={r.m} className={`matchup-row matchup-row--${r.tone}`}>
            <div className="matchup-row__label">
              <span className="matchup-row__mult">{formatMultiplier(r.m)}</span>
              <span className="matchup-row__text">{r.label}</span>
            </div>
            <div className="matchup-row__types">
              {vsTypes.get(r.m)!.map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="coverage">
        <h3 className="section-title">Coverage across all {entries.length.toLocaleString()} Pokémon</h3>
        <div className="coverage__bar" role="img" aria-label="Coverage breakdown">
          {COVERAGE.map((c) => {
            const pct = (coverage[c.key].length / entries.length) * 100;
            return pct > 0 ? (
              <span key={c.key} style={{ width: `${pct}%`, background: c.color } as CSSProperties} />
            ) : null;
          })}
        </div>
        <div className="coverage__legend">
          {COVERAGE.map((c) => (
            <div key={c.key} className="coverage__item">
              <i style={{ background: c.color }} />
              <span>{c.label}</span>
              <strong>{coverage[c.key].length}</strong>
              <span className="muted">{Math.round((coverage[c.key].length / entries.length) * 100)}%</span>
            </div>
          ))}
        </div>
        {walls.length > 0 && (
          <>
            <h3 className="section-title">Walls these moves can’t hit hard</h3>
            <MonAvatars entries={walls.slice(0, 14)} total={walls.length} />
          </>
        )}
      </div>
    </>
  );
}
