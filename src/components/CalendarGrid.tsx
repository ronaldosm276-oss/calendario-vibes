import type { CSSProperties } from 'react';
import type { CalendarEvent, Settings } from '../types/calendar';
import { calendarGrid, dateKey, eventDisplayTime, eventsForDay } from '../utils/date';
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

const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({ month, events, settings, syncing, onMonthChange, onDay, selectedDay, onEvent, onCreate, onToday, onRefresh }: Props) {
  const days = calendarGrid(month, settings.firstDayOfWeek);
  const labels = settings.firstDayOfWeek === 1 ? [...names.slice(1), names[0]] : names;
  const todayKey = dateKey(new Date());
  const selectedKey = selectedDay ? dateKey(selectedDay) : '';
  const monthTitle = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month);

  const shift = (delta: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <section className="calendar-panel">
      <header className="calendar-header">
        <div>
          <div className="month-title">{monthTitle}</div>
          <button className="today-button" onClick={onToday}>Today</button>
        </div>
        <div className="calendar-controls">
          <button title="Previous month" onClick={() => shift(-1)}><ChevronLeft size={17} /></button>
          <button title="Next month" onClick={() => shift(1)}><ChevronRight size={17} /></button>
          <button title="Refresh" className={syncing ? 'spinning' : ''} onClick={onRefresh}><RefreshCw size={15} /></button>
        </div>
      </header>
      <div className="weekday-row">{labels.map((name) => <div key={name}>{name}</div>)}</div>
      <div className="calendar-grid">
        {days.map((day) => {
          const key = dateKey(day);
          const dayEvents = eventsForDay(events, day);
          const outside = day.getMonth() !== month.getMonth();
          return (
            <button
              key={key}
              className={`day-cell ${outside ? 'outside' : ''} ${key === todayKey ? 'today' : ''} ${key === selectedKey ? 'selected' : ''}`}
              onClick={() => onDay(day)}
              onDoubleClick={() => { if (dayEvents.length === 0) onCreate(day); }}
            >
              <span className="day-number">{day.getDate()}</span>
              <span className="day-events">
                {dayEvents.slice(0, 3).map((event) => (
                  <span
                    key={`${event.calendarId}:${event.id}`}
                    className="event-chip"
                    style={{ '--event-color': event.eventColor || event.calendarColor || 'var(--accent)' } as CSSProperties}
                    onClick={(e) => { e.stopPropagation(); onEvent(event); }}
                    title={event.summary}
                  >
                    {!event.start.date && <small>{eventDisplayTime(event, settings.timeFormat)}</small>}
                    <span>{event.summary || '(No title)'}</span>
                  </span>
                ))}
                {dayEvents.length > 3 && <span className="more-events">+{dayEvents.length - 3} more</span>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
