import type { CSSProperties } from 'react';
import { TYPE_COLORS, textColorOn, type TypeName } from '../lib/types';
import { titleCase } from '../lib/format';

interface TypeBadgeProps {
  type: TypeName;
  size?: 'sm' | 'md';
  /** Render as a toggle button instead of a static label. */
  onClick?: () => void;
  selected?: boolean;
  dimmed?: boolean;
}

export function typeStyle(type: TypeName): CSSProperties {
  return { '--type': TYPE_COLORS[type], '--type-text': textColorOn(TYPE_COLORS[type]) } as CSSProperties;
}

export function TypeBadge({ type, size = 'md', onClick, selected, dimmed }: TypeBadgeProps) {
  const className = ['type-badge', `type-badge--${size}`, dimmed && 'is-dimmed', selected && 'is-selected']
    .filter(Boolean)
    .join(' ');

  if (onClick) {
    return (
      <button type="button" className={className} style={typeStyle(type)} onClick={onClick} aria-pressed={selected}>
        {titleCase(type)}
      </button>
    );
  }
  return (
    <span className={className} style={typeStyle(type)}>
      {titleCase(type)}
    </span>
  );
}
