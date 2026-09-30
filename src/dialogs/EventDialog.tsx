import { useEffect, useState } from 'react';
import type { CalendarEvent, CalendarInfo, EventDraft } from '../types/calendar';
import { X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { normalizeHex } from '../utils/colors';

interface Props {
  event?: CalendarEvent;
  date: Date;
  calendars: CalendarInfo[];
  defaultCalendarId?: string;
  onClose: () => void;
  onSave: (event: CalendarEvent, color: string | null) => Promise<void>;
  eventColor?: string;
  colorFor: (calendarId: string) => string;
  onDelete?: () => Promise<void>;
}

function pad(value: number) { return String(value).padStart(2, '0'); }
function localDateString(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
function addOneDay(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return localDateString(date);
}
function normalizeEndDate(start: string, end: string) {
  return end > start ? end : addOneDay(start);
}
function canWriteCalendar(calendar: CalendarInfo) {
  return !calendar.accessRole || ['owner', 'writer', 'writerWithoutPrivateAccess'].includes(calendar.accessRole);
}

function draftFromEvent(event: CalendarEvent | undefined, date: Date, calendarId: string): EventDraft {
  if (!event) {
    const value = localDateString(date);
    return {
      calendarId, title: '', date: value, endDate: value, startTime: '09:00', endTime: '10:00',
      allDay: false, location: '', description: ''
    };
  }

  if (event.start.date) {
    return {
      calendarId: event.calendarId,
      title: event.summary,
      date: event.start.date,
      endDate: event.end.date || addOneDay(event.start.date),
      startTime: '09:00',
      endTime: '10:00',
      allDay: true,
      location: event.location || '',
      description: event.description || ''
    };
  }

  const start = event.start.dateTime ? new Date(event.start.dateTime) : date;
  const end = event.end.dateTime ? new Date(event.end.dateTime) : new Date(start.getTime() + 60 * 60 * 1000);
  return {
    calendarId: event.calendarId,
    title: event.summary,
    date: localDateString(start),
    endDate: localDateString(end),
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
    allDay: false,
    location: event.location || '',
    description: event.description || ''
  };
}

export function EventDialog({ event, date, calendars, defaultCalendarId, onClose, onSave, onDelete, eventColor, colorFor }: Props) {
  const writableCalendars = calendars.filter(canWriteCalendar);
  const currentEventCalendar = event ? calendars.find(c => c.id === event.calendarId) : undefined;
  const selectableCalendars = event
    ? currentEventCalendar ? [currentEventCalendar] : writableCalendars.filter(c => c.id === event.calendarId)
    : writableCalendars;
  const initialCalendarId = event?.calendarId || (defaultCalendarId && writableCalendars.some(c => c.id === defaultCalendarId) ? defaultCalendarId : writableCalendars[0]?.id || '');
  const readOnlyEventCalendar = Boolean(event && currentEventCalendar && !canWriteCalendar(currentEventCalendar));
  const [draft, setDraft] = useState<EventDraft>(() => draftFromEvent(event, date, initialCalendarId));
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [color, setColor] = useState<string | null>(normalizeHex(eventColor));
  const trapRef = useFocusTrap<HTMLDivElement>();

  useEffect(() => {
    setDraft(draftFromEvent(event, date, event?.calendarId || initialCalendarId));
    setValidationError('');
  }, [event, date, initialCalendarId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, saving]);

  const save = async () => {
    setValidationError('');
    if (!draft.title.trim()) {
      setValidationError('Title is required.');
      return;
    }
    if (!draft.calendarId) {
      setValidationError('Choose a calendar.');
      return;
    }
    if (!draft.allDay) {
      const startLocal = new Date(`${draft.date}T${draft.startTime}:00`);
      const endLocal = new Date(`${draft.endDate}T${draft.endTime}:00`);
      if (!(endLocal > startLocal)) {
        setValidationError('End must be after start.');
        return;
      }
    }
    setSaving(true);
    try {
      const start = draft.allDay
        ? { date: draft.date }
        : { dateTime: `${draft.date}T${draft.startTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
      const end = draft.allDay
        ? { date: normalizeEndDate(draft.date, draft.endDate) }
        : { dateTime: `${draft.endDate}T${draft.endTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };

      const payload: CalendarEvent = event
        ? { ...event, calendarId: draft.calendarId, summary: draft.title.trim(), description: draft.description, location: draft.location, start, end }
        : {
            id: '', calendarId: draft.calendarId, summary: draft.title.trim(), description: draft.description, location: draft.location,
            start, end
          };
      await onSave(payload, color);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.currentTarget === e.target && !saving) onClose(); }}>
    <div className="modal event-dialog" ref={trapRef} role="dialog" aria-modal="true" aria-label={event ? 'Event details' : 'New event'}>
      <div className="modal-header"><div><strong>{event ? 'Event details' : 'New event'}</strong><span>{draft.date}</span></div><button aria-label="Close" onClick={onClose}><X size={17} /></button></div>
      <label>Title<input autoFocus maxLength={500} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Event title" /></label>
      <div className="form-row"><label>Calendar<select disabled={Boolean(event) || readOnlyEventCalendar} value={draft.calendarId} onChange={e => setDraft({ ...draft, calendarId: e.target.value })}>{selectableCalendars.map(c => <option key={c.id} value={c.id}>{c.summary}</option>)}</select></label><label className="check-label"><input type="checkbox" checked={draft.allDay} onChange={e => setDraft({ ...draft, allDay: e.target.checked })} /> All day</label></div>
      {draft.allDay ? <div className="form-row"><label>Start date<input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value, endDate: normalizeEndDate(e.target.value, draft.endDate) })} /></label><label>End date<input type="date" value={draft.endDate} min={addOneDay(draft.date)} onChange={e => setDraft({ ...draft, endDate: e.target.value })} /></label></div>
        : <><div className="form-row"><label>Start date<input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value, endDate: draft.endDate < e.target.value ? e.target.value : draft.endDate })} /></label><label>End date<input type="date" value={draft.endDate} min={draft.date} onChange={e => setDraft({ ...draft, endDate: e.target.value })} /></label></div><div className="form-row"><label>Start<input type="time" value={draft.startTime} onChange={e => setDraft({ ...draft, startTime: e.target.value })} /></label><label>End<input type="time" value={draft.endTime} onChange={e => setDraft({ ...draft, endTime: e.target.value })} /></label></div></>}
      {readOnlyEventCalendar && <div className="form-error" role="alert">This calendar is read-only for this account.</div>}
      {validationError && <div className="form-error" role="alert">{validationError}</div>}
      <label>Location<input maxLength={1000} value={draft.location} onChange={e => setDraft({ ...draft, location: e.target.value })} /></label>
      <label>Color (saved in this app only)<div className="color-row"><input type="color" value={color ?? colorFor(draft.calendarId)} onChange={e => setColor(e.target.value)} />{color && <button type="button" className="reset-btn" onClick={() => setColor(null)}>Use calendar color</button>}</div></label>
      <label>Description<textarea maxLength={20000} rows={4} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label>
      <div className="modal-actions">{event && onDelete && <button className="danger-button" disabled={saving} onClick={() => void onDelete()}>Delete</button>}<span /><button onClick={onClose} disabled={saving}>Cancel</button><button className="primary-button" disabled={saving || readOnlyEventCalendar || !draft.title.trim() || !draft.calendarId} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</button></div>
    </div>
  </div>;
}
