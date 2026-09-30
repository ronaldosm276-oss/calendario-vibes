import { invoke } from '@tauri-apps/api/core';
import type { AuthState, CalendarEvent, CalendarInfo, Settings, SyncState } from '../types/calendar';

export const api = {
  getAuthState: () => invoke<AuthState>('get_auth_state'),
  signIn: () => invoke<AuthState>('sign_in'),
  signOut: () => invoke<void>('sign_out'),
  listCalendars: () => invoke<CalendarInfo[]>('list_calendars'),
  getCachedCalendars: () => invoke<CalendarInfo[]>('get_cached_calendars'),
  listEvents: (start: string, end: string, calendarIds: string[]) =>
    invoke<CalendarEvent[]>('list_events', { start, end, calendarIds }),
  createEvent: (event: CalendarEvent) => invoke<CalendarEvent>('create_event', { event }),
  updateEvent: (event: CalendarEvent) => invoke<CalendarEvent>('update_event', { event }),
  deleteEvent: (calendarId: string, eventId: string) => invoke<void>('delete_event', { calendarId, eventId }),
  sync: () => invoke<SyncState>('sync_now'),
  getCachedEvents: (start: string, end: string) => invoke<CalendarEvent[]>('get_cached_events', { start, end }),
  getSettings: () => invoke<Settings>('get_settings'),
  saveSettings: (settings: Settings) => invoke<void>('save_settings', { settings }),
  setWindowState: (x: number, y: number, width: number, height: number) =>
    invoke<void>('save_window_state', { x, y, width, height }),
  getWindowState: () => invoke<{ x?: number; y?: number; width?: number; height?: number }>('get_window_state')
};
