import { useEffect, useMemo, useState } from 'react';
import { CalendarGrid } from './components/CalendarGrid';
import { TitleBar } from './components/TitleBar';
import { EventDialog } from './dialogs/EventDialog';
import { SettingsPanel } from './pages/SettingsPanel';
import { api } from './services/tauriApi';
import type { AuthState, CalendarEvent, CalendarInfo, Settings, SyncState } from './types/calendar';
import { monthKey } from './utils/date';
import './styles/app.css';

const defaultSettings: Settings = {
  theme: 'system', alwaysOnTop: false, startWithWindows: false, startHidden: false,
  rememberPosition: true, rememberSize: true, opacity: 0.96, visibleCalendarIds: [],
  firstDayOfWeek: 1, timeFormat: '24h', automaticSync: true, syncIntervalMinutes: 15,
  selectedMonth: ''
};

function monthRange(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function monthFromKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const [year, month] = value.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.getFullYear() === year && date.getMonth() === month - 1 ? date : null;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isOfflineError(message: string): boolean {
  return /network|timed out|timeout|connection|dns|offline|fetch/i.test(message);
}

export default function App() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsReady, setSettingsReady] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ authenticated: false });
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [sync, setSync] = useState<SyncState>({ status: 'idle' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [eventDialog, setEventDialog] = useState<{ event?: CalendarEvent; date: Date } | null>(null);
  const [error, setError] = useState('');

  const visibleCalendars = useMemo(
    () => calendars.filter(c => (settings.visibleCalendarIds ?? []).includes(c.id)),
    [calendars, settings.visibleCalendarIds]
  );

  useEffect(() => {
    (async () => {
      try {
        const [savedSettings, savedAuth] = await Promise.all([api.getSettings(), api.getAuthState()]);
        const restoredSettings: Settings = {
          ...defaultSettings,
          ...savedSettings,
          visibleCalendarIds: Array.isArray(savedSettings?.visibleCalendarIds) ? savedSettings.visibleCalendarIds : [],
        };
        setSettings(restoredSettings);
        setSettingsReady(true);
        setAuth(savedAuth);
        const restoredMonth = monthFromKey(restoredSettings.selectedMonth);
        if (restoredMonth) setMonth(restoredMonth);
      } catch (e) {
        setSettingsReady(true);
        setError(errorText(e));
      }
    })();
  }, []);

  useEffect(() => {
    if (!settingsReady) return;
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.setProperty('--window-opacity', String(settings.opacity));
    api.saveSettings(settings).catch(e => setError(errorText(e)));
  }, [settings, settingsReady]);

  useEffect(() => {
    if (!settingsReady) return;
    setSettings(current => current.selectedMonth === monthKey(month) ? current : { ...current, selectedMonth: monthKey(month) });
  }, [month, settingsReady]);

  useEffect(() => {
    if (!auth.authenticated || !settingsReady) return;
    void loadData();
  }, [auth.authenticated, settingsReady, month, (settings.visibleCalendarIds ?? []).join('|')]);

  useEffect(() => {
    if (!auth.authenticated || !settings.automaticSync || !settingsReady) return;
    const id = window.setInterval(() => void refresh(true), settings.syncIntervalMinutes * 60_000);
    return () => window.clearInterval(id);
  }, [auth.authenticated, settings.automaticSync, settings.syncIntervalMinutes, settingsReady]);

  async function loadData() {
    const range = monthRange(month);
    try {
      setEvents(await api.getCachedEvents(range.start, range.end));
    } catch (e) {
      setSync({ status: 'error', message: errorText(e) });
    }

    if (!calendars.length) {
      try {
        const calendarList = await api.listCalendars();
        setCalendars(calendarList);
        setSettings(current => (current.visibleCalendarIds ?? []).length
          ? current
          : { ...current, visibleCalendarIds: calendarList.map(c => c.id), defaultCalendarId: calendarList.find(c => c.primary)?.id || calendarList[0]?.id });
      } catch (e) {
        try {
          const cachedCalendars = await api.getCachedCalendars();
          if (cachedCalendars.length) setCalendars(cachedCalendars);
        } catch {
          // Event cache remains useful even without calendar metadata.
        }
        const message = errorText(e);
        setSync({ status: isOfflineError(message) ? 'offline' : 'error', message });
      }
    }

    await refresh(true);
  }

  async function refresh(silent = false) {
    if (!auth.authenticated) return;
    if (!silent) setSync({ status: 'syncing' });
    try {
      const result = await api.sync();
      setSync(result);
      const range = monthRange(month);
      setEvents(await api.getCachedEvents(range.start, range.end));
    } catch (e) {
      const message = errorText(e);
      setSync({ status: /authentication required/i.test(message) ? 'auth-required' : isOfflineError(message) ? 'offline' : 'error', message });
    }
  }

  async function signIn() {
    try {
      const account = await api.signIn();
      setAuth(account);
      setSettingsOpen(false);
    } catch (e) {
      setError(errorText(e));
    }
  }

  async function signOut() {
    try {
      await api.signOut();
      setAuth({ authenticated: false });
      setCalendars([]);
      setEvents([]);
      setSync({ status: 'idle' });
    } catch (e) {
      setError(errorText(e));
    }
  }

  async function saveEvent(event: CalendarEvent) {
    try {
      const saved = event.id ? await api.updateEvent(event) : await api.createEvent(event);
      setEvents(old => event.id
        ? old.map(existing => existing.id === saved.id && existing.calendarId === saved.calendarId ? saved : existing)
        : [...old, saved]);
      await refresh(true);
    } catch (e) {
      setError(errorText(e));
      throw e;
    }
  }

  async function deleteEvent(event: CalendarEvent) {
    if (!window.confirm(`Delete “${event.summary || '(No title)'}”?`)) return;
    try {
      await api.deleteEvent(event.calendarId, event.id);
      setEvents(old => old.filter(e => !(e.id === event.id && e.calendarId === event.calendarId)));
      setEventDialog(null);
      await refresh(true);
    } catch (e) {
      setError(errorText(e));
    }
  }

  const shownEvents = events.filter(e => (settings.visibleCalendarIds ?? []).includes(e.calendarId));

  return <div className="app-shell">
    <TitleBar onSettings={() => setSettingsOpen(true)} />
    <main>
      <CalendarGrid
        month={month}
        events={shownEvents}
        settings={settings}
        syncing={sync.status === 'syncing'}
        onMonthChange={setMonth}
        onDay={setSelectedDay}
        selectedDay={selectedDay}
        onEvent={(event) => setEventDialog({ event, date: selectedDay })}
        onCreate={(date) => setEventDialog({ date })}
        onToday={() => { const day = new Date(); setSelectedDay(day); setMonth(new Date(day.getFullYear(), day.getMonth(), 1)); }}
        onRefresh={() => void refresh(false)}
      />
    </main>
    <footer className="statusbar">
      <span className={`status-dot ${sync.status}`} />
      {sync.status === 'syncing' ? 'Syncing…' : sync.status === 'synced' ? 'Synced' : sync.status === 'offline' ? 'Offline' : sync.status === 'auth-required' ? 'Authentication required' : auth.authenticated ? 'Ready' : 'Sign in to sync'}
      <span className="status-spacer" />
      <span>{visibleCalendars.length} calendar{visibleCalendars.length === 1 ? '' : 's'}</span>
    </footer>
    {!auth.authenticated && <div className="signin-hint"><button className="primary-button" onClick={() => void signIn()}>Sign in with Google</button><span>Cached events are kept locally for temporary offline access.</span></div>}
    {settingsOpen && <SettingsPanel settings={settings} calendars={calendars} auth={auth} onChange={setSettings} onClose={() => setSettingsOpen(false)} onSignIn={() => void signIn()} onSignOut={() => void signOut()} onError={setError} />}
    {eventDialog && <EventDialog event={eventDialog.event} date={eventDialog.date} calendars={visibleCalendars.length ? visibleCalendars : calendars} defaultCalendarId={settings.defaultCalendarId} onClose={() => setEventDialog(null)} onSave={saveEvent} onDelete={eventDialog.event ? () => deleteEvent(eventDialog.event!) : undefined} />}
    {error && <div className="toast" role="status" onClick={() => setError('')}>{error}</div>}
  </div>;
}
