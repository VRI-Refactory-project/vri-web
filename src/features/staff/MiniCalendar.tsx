import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatWhen, STATUS_LABEL, titleFor } from '../sessions/sessionHistory';
import type { HistoryItem } from '../../services/mySessions';
import { dayKey, monthGrid } from './calendarDays';
import './MiniCalendar.css';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  /** The person's own sessions; days that have one get a dot. */
  items: HistoryItem[];
  /** Where a session opens, e.g. `/dashboard/staff/sessions`. */
  detailsBase: string;
  today?: Date;
}

/** A small month calendar (like Google Meet's) with the chosen day's sessions underneath. */
export function MiniCalendar({ items, detailsBase, today = new Date() }: Props) {
  const [shown, setShown] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(() => dayKey(today));
  const [showAll, setShowAll] = useState(false);

  const byDay = useMemo(() => {
    const map = new Map<string, HistoryItem[]>();
    for (const item of items) {
      if (['cancelled', 'failed', 'missed'].includes(item.status.toLowerCase())) continue;
      const when = new Date(item.createdAt);
      if (Number.isNaN(when.getTime())) continue;
      const key = dayKey(when);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [items]);

  const cells = monthGrid(shown.getFullYear(), shown.getMonth());
  const todayKey = dayKey(today);
  const monthLabel = shown.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
  const chosen = byDay.get(selected) ?? [];
  const visibleChosen = showAll ? chosen : chosen.slice(0, 3);
  const chosenLabel = new Date(`${selected}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const move = (by: number) =>
    setShown((current) => new Date(current.getFullYear(), current.getMonth() + by, 1));

  const goToToday = () => {
    setShown(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(todayKey);
    setShowAll(false);
  };

  return (
    <section className="mc" aria-label="Calendar">
      <header className="mc-head">
        <strong aria-live="polite">{monthLabel}</strong>
        <span className="mc-nav">
          <button type="button" onClick={goToToday} className="mc-today">
            Today
          </button>
          <button type="button" onClick={() => move(-1)} aria-label="Previous month">
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next month">
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </span>
      </header>

      <div className="mc-grid" role="grid" aria-label={monthLabel}>
        {WEEKDAYS.map((letter, i) => (
          <span key={i} className="mc-weekday" aria-hidden="true">
            {letter}
          </span>
        ))}
        {cells.map((date) => {
          const key = dayKey(date);
          const count = byDay.get(key)?.length ?? 0;
          const outside = date.getMonth() !== shown.getMonth();
          const classes = [
            'mc-day',
            outside && 'mc-day--outside',
            key === todayKey && 'mc-day--today',
            key === selected && 'mc-day--selected',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={key}
              type="button"
              className={classes}
              aria-pressed={key === selected}
              aria-label={`${date.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}${count ? `, ${count} session${count === 1 ? '' : 's'}` : ''}`}
              onClick={() => {
                setSelected(key);
                setShowAll(false);
              }}
            >
              {date.getDate()}
              {count > 0 && <span className="mc-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="mc-day-list">
        <h3>{chosenLabel}</h3>
        {chosen.length === 0 ? (
          <p>No sessions this day.</p>
        ) : (
          <ul>
            {visibleChosen.map((item) => (
              <li key={item.id}>
                <Link to={`${detailsBase}/${item.id}`}>
                  <span>
                    <strong>{formatWhen(item.createdAt)}</strong>
                    <small>{titleFor(item)}</small>
                  </span>
                  <span className={`sd-pill sd-pill--${item.status}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {chosen.length > 3 && (
          <button
            type="button"
            aria-expanded={showAll}
            onClick={() => setShowAll((current) => !current)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
              padding: 4,
              border: 0,
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            {showAll ? 'View less' : 'View more'}
            {showAll ? (
              <ChevronUp size={15} aria-hidden="true" />
            ) : (
              <ChevronDown size={15} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </section>
  );
}
