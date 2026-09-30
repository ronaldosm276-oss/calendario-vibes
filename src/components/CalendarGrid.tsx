import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import type { CalendarEvent, Settings } from '../types/calendar';
import { calendarGrid, dateKey, eventDisplayTime, eventsForDay, parseLocalDate } from '../utils/date';
import { readableText, resolveEventColor } from '../utils/colors';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface Props {
  month: Date;
  events: CalendarEvent[];
  settings: Settings;
  syncing: boolean;
  onMonthChange: (month: Date) => void;
  onDay: (day: Date) => void;
  selectedDay?: Date;
  onEvent: (event: CalendarEvent) => void;
  onCreate: (day: Date) => void;
  onToday: () => void;
  onRefresh: () => void;
}

const names = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(2026, 0, 4 + i)));
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export function CalendarGrid({ month, events, settings, syncing, onMonthChange, onDay, selectedDay, onEvent, onCreate, onToday, onRefresh }: Props) {
  const days = calendarGrid(month, settings.firstDayOfWeek);
  const labels = settings.firstDayOfWeek === 1 ? [...names.slice(1), names[0]] : names;
  const keys = days.map(dateKey);
  const todayKey = dateKey(new Date());
  const selectedKey = selectedDay ? dateKey(selectedDay) : '';
  const tabKey = keys.includes(selectedKey) ? selectedKey : keys.includes(todayKey) ? todayKey : keys[7];
  const maxChips = settings.density === 'compact' ? 3 : 2;
  const monthTitle = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month);
  const gridRef = useRef<HTMLDivElement>(null);
  const focusKey = useRef<string | null>(null);

  // After a keyboard move (possibly into another month) put focus on the new day.
  useEffect(() => {
    if (!focusKey.current) return;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${focusKey.current}"]`)?.focus();
    focusKey.current = null;
  });

  const shift = (delta: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const key = (e.target as HTMLElement).dataset?.date;
    if (!key || e.ctrlKey || e.metaKey || e.altKey) return;
    const cur = parseLocalDate(key);
    const offset = (cur.getDay() - settings.firstDayOfWeek + 7) % 7;
    const monthStep = (delta: number) => {
      const first = new Date(cur.getFullYear(), cur.getMonth() + delta, 1);
      const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      return new Date(first.getFullYear(), first.getMonth(), Math.min(cur.getDate(), last));
    };
    let next: Date;
    switch (e.key) {
      case 'ArrowLeft': next = addDays(cur, -1); break;
      case 'ArrowRight': next = addDays(cur, 1); break;
      case 'ArrowUp': next = addDays(cur, -7); break;
      case 'ArrowDown': next = addDays(cur, 7); break;
      case 'Home': next = addDays(cur, -offset); break;
      case 'End': next = addDays(cur, 6 - offset); break;
      case 'PageUp': next = monthStep(-1); break;
      case 'PageDown': next = monthStep(1); break;
      case 'n': case 'N': e.preventDefault(); onCreate(cur); return;
      default: return;
    }
    e.preventDefault();
    onDay(next);
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) {
      onMonthChange(new Date(next.getFullYear(), next.getMonth(), 1));
    }
    focusKey.current = dateKey(next);
  };

  return (
    <section className="calendar-panel">
      <header className="calendar-header">
        <div>
          <div className="month-title">{monthTitle}</div>
          <button className="today-button" onClick={onToday}>Today</button>
        </div>
        <div className="calendar-controls">
          <button title="Previous month" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={17} /></button>
          <button title="Next month" aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={17} /></button>
          <button title="Refresh" aria-label="Refresh" className={syncing ? 'spinning' : ''} onClick={onRefresh}><RefreshCw size={15} /></button>
        </div>
      </header>
      <div className="weekday-row" aria-hidden="true">{labels.map((name) => <div key={name}>{name}</div>)}</div>
      <div className="calendar-grid" role="grid" aria-label={monthTitle} ref={gridRef} onKeyDown={onKeyDown}>
        {Array.from({ length: 6 }, (_, week) => (
          <div key={week} role="row" className="week-row">
            {days.slice(week * 7, week * 7 + 7).map((day) => {
              const key = dateKey(day);
              const dayEvents = eventsForDay(events, day);
              const outside = day.getMonth() !== month.getMonth();
              const label = `${new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(day)}, ${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}`;
              return (
                <div
                  key={key}
                  role="gridcell"
                  aria-selected={key === selectedKey}
                  className={`day-cell ${outside ? 'outside' : ''} ${key === todayKey ? 'today' : ''} ${key === selectedKey ? 'selected' : ''}`}
                  onClick={() => onDay(day)}
                  onDoubleClick={() => { if (dayEvents.length === 0) onCreate(day); }}
                >
                  <button
                    className="day-number"
                    data-date={key}
                    tabIndex={key === tabKey ? 0 : -1}
                    aria-label={label}
                    onClick={(e) => { e.stopPropagation(); onDay(day); }}
                  >{day.getDate()}</button>
                  <div className="day-events">
                    {dayEvents.slice(0, maxChips).map((event) => {
                      const color = resolveEventColor(event, settings);
                      return (
                        <button
                          key={`${event.calendarId}:${event.id}`}
                          className="event-chip"
                          style={{ '--chip-bg': color, '--chip-fg': readableText(color) } as CSSProperties}
                          onClick={(e) => { e.stopPropagation(); onEvent(event); }}
                          onDoubleClick={(e) => e.stopPropagation()}
                          title={event.summary}
                        >
                          {!event.start.date && <small>{eventDisplayTime(event, settings.timeFormat)}</small>}
                          <span>{event.summary || '(No title)'}</span>
                        </button>
                      );
                    })}
                    {dayEvents.length > maxChips && <span className="more-events">+{dayEvents.length - maxChips} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
