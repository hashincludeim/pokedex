import { useState } from 'react';
import { TYPES, formatMultiplier, type TypeChart, type TypeName } from '../lib/types';
import { titleCase } from '../lib/format';
import { typeStyle } from './TypeBadge';

const CELL_CLASS: Record<number, string> = { 2: 'cell--super', 0.5: 'cell--weak', 0: 'cell--none' };

interface TypeChartGridProps {
  chart: TypeChart;
  highlightRows?: readonly TypeName[];
  highlightCols?: readonly TypeName[];
}

/** The full 18×18 effectiveness matrix: rows attack, columns defend. */
export function TypeChartGrid({ chart, highlightRows = [], highlightCols = [] }: TypeChartGridProps) {
  const [hover, setHover] = useState<{ row: TypeName; col: TypeName } | null>(null);

  return (
    <div className="chart-scroll">
      <table
        className={`type-chart ${highlightRows.length || highlightCols.length ? 'has-highlight' : ''}`}
        onMouseLeave={() => setHover(null)}
      >
        <thead>
          <tr>
            <th className="type-chart__corner" scope="col">
              <span>Atk ↓</span>
              <span>Def →</span>
            </th>
            {TYPES.map((col) => (
              <th
                key={col}
                scope="col"
                className={[
                  'type-chart__col',
                  hover?.col === col && 'is-hover',
                  highlightCols.includes(col) && 'is-highlight',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={titleCase(col)}
              >
                <span className="type-chart__abbr" style={typeStyle(col)}>
                  {col.slice(0, 3)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TYPES.map((row) => (
            <tr key={row} className={highlightRows.includes(row) ? 'is-highlight' : undefined}>
              <th scope="row" className={`type-chart__row ${hover?.row === row ? 'is-hover' : ''}`}>
                <span className="type-chart__label" style={typeStyle(row)}>
                  {titleCase(row)}
                </span>
              </th>
              {TYPES.map((col) => {
                const m = chart[row][col];
                const active = hover && (hover.row === row || hover.col === col);
                const highlighted = highlightRows.includes(row) || highlightCols.includes(col);
                return (
                  <td
                    key={col}
                    className={[
                      'cell',
                      CELL_CLASS[m],
                      active && 'is-crosshair',
                      hover?.row === row && hover.col === col && 'is-focus',
                      highlighted && 'is-highlight',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseEnter={() => setHover({ row, col })}
                    title={`${titleCase(row)} → ${titleCase(col)}: ${formatMultiplier(m)}`}
                  >
                    {m === 1 ? '' : m === 0.5 ? '½' : m}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
