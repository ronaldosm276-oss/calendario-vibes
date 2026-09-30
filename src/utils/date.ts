import type { CalendarEvent } from '../types/calendar';

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function calendarGrid(month: Date, firstDayOfWeek: 0 | 1): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() - firstDayOfWeek + 7) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function eventOverlapsDay(event: CalendarEvent, day: Date): boolean {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  if (event.start.date && event.end.date) {
    const start = parseLocalDate(event.start.date);
    const end = parseLocalDate(event.end.date); // Google all-day end is exclusive.
    return start < dayEnd && end > dayStart;
  }

  const start = event.start.dateTime ? new Date(event.start.dateTime) : dayStart;
  const end = event.end.dateTime ? new Date(event.end.dateTime) : start;
  return start < dayEnd && end > dayStart;
}

export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => eventOverlapsDay(event, day));
}

export function eventDisplayTime(event: CalendarEvent, timeFormat: '12h' | '24h', timeZone?: string): string {
  if (event.start.date) return 'All day';
  if (!event.start.dateTime) return '';
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: timeFormat === '12h',
    ...(timeZone ? { timeZone } : {})
  }).format(new Date(event.start.dateTime));
}
