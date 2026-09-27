import { useId, useMemo, useState } from 'react';
import type { DexEntry } from '../lib/api';
import { formatId, formatName, spriteUrl } from '../lib/format';
import { Artwork } from './Artwork';
import { SearchIcon } from './Icons';
import { TypeBadge } from './TypeBadge';

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

interface PokemonPickerProps {
  entries: DexEntry[];
  onPick: (entry: DexEntry) => void;
  placeholder?: string;
}

/** Accessible autocomplete for choosing a Pokémon by name or number. */
export function PokemonPicker({ entries, onPick, placeholder = 'Find a Pokémon…' }: PokemonPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const matches = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    if (/^\d+$/.test(q)) return entries.filter((e) => String(e.id).startsWith(String(Number(q)))).slice(0, 8);
    const starts: DexEntry[] = [];
    const contains: DexEntry[] = [];
    for (const e of entries) {
      const n = normalize(e.name);
      if (n.startsWith(q)) starts.push(e);
      else if (n.includes(q)) contains.push(e);
    }
    return [...starts, ...contains].slice(0, 8);
  }, [entries, query]);

  const pick = (entry: DexEntry) => {
    onPick(entry);
    setQuery('');
    setOpen(false);
  };

  const showList = open && matches.length > 0;

  return (
    <div className="picker">
      <label className="search">
        <SearchIcon className="search__icon" />
        <input
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${listId}-${active}` : undefined}
          aria-label="Choose a Pokémon"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (!showList) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => (i + 1) % matches.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => (i - 1 + matches.length) % matches.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              pick(matches[active]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
      </label>

      {showList && (
        <ul className="picker__list" id={listId} role="listbox">
          {matches.map((m, i) => (
            <li
              key={m.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`picker__option ${i === active ? 'is-active' : ''}`}
              // mousedown (not click) so it fires before the input's blur closes the list
              onMouseDown={(e) => {
                e.preventDefault();
                pick(m);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <div className="picker__sprite">
                <Artwork src={spriteUrl(m.id)} alt="" />
              </div>
              <div className="picker__text">
                <span className="picker__name">{formatName(m.name)}</span>
                <span className="picker__id">{formatId(m.id)}</span>
              </div>
              <div className="picker__types">
                {m.types.map((t) => (
                  <TypeBadge key={t} type={t} size="sm" />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
