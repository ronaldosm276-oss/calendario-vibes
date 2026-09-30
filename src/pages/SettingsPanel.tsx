import type { AuthState, CalendarInfo, Settings } from '../types/calendar';
import { X } from 'lucide-react';
import { enable as enableAutostart, disable as disableAutostart } from '@tauri-apps/plugin-autostart';

interface Props { settings: Settings; calendars: CalendarInfo[]; auth: AuthState; onChange: (s: Settings) => void; onClose: () => void; onSignIn: () => void; onSignOut: () => void; onError: (message: string) => void; }
export function SettingsPanel({ settings, calendars, auth, onChange, onClose, onSignIn, onSignOut, onError }: Props) {
  const patch = async (p: Partial<Settings>) => {
    if ('startWithWindows' in p) {
      try {
        if (p.startWithWindows) await enableAutostart(); else await disableAutostart();
      } catch (error) {
        onError(error instanceof Error ? error.message : String(error));
        return;
      }
    }
    onChange({ ...settings, ...p });
  };
  const toggleCalendar = (id: string) => patch({ visibleCalendarIds: settings.visibleCalendarIds.includes(id) ? settings.visibleCalendarIds.filter(x => x !== id) : [...settings.visibleCalendarIds, id] });
  return <div className="modal-backdrop"><aside className="settings-panel">
    <header className="modal-header"><strong>Settings</strong><button onClick={onClose}><X size={17} /></button></header>
    <div className="settings-scroll">
      <section><h3>Appearance</h3><label>Theme<select value={settings.theme} onChange={e => patch({theme: e.target.value as Settings['theme']})}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></section>
      <section><h3>Window</h3><Check label="Always on top" checked={settings.alwaysOnTop} onChange={v => patch({alwaysOnTop:v})}/><Check label="Start with Windows" checked={settings.startWithWindows} onChange={v => patch({startWithWindows:v})}/><Check label="Start hidden" checked={settings.startHidden} onChange={v => patch({startHidden:v})}/><Check label="Remember position" checked={settings.rememberPosition} onChange={v => patch({rememberPosition:v})}/><Check label="Remember size" checked={settings.rememberSize} onChange={v => patch({rememberSize:v})}/><label>Opacity<input type="range" min="0.75" max="1" step="0.01" value={settings.opacity} onChange={e => patch({opacity:Number(e.target.value)})}/></label></section>
      <section><h3>Calendar</h3><label>Default calendar<select value={settings.defaultCalendarId || ''} onChange={e => patch({defaultCalendarId:e.target.value})}>{calendars.map(c => <option key={c.id} value={c.id}>{c.summary}</option>)}</select></label><label>First day<select value={settings.firstDayOfWeek} onChange={e => patch({firstDayOfWeek:Number(e.target.value) as 0|1})}><option value="1">Monday</option><option value="0">Sunday</option></select></label><label>Time format<select value={settings.timeFormat} onChange={e => patch({timeFormat:e.target.value as Settings['timeFormat']})}><option value="24h">24 hour</option><option value="12h">12 hour</option></select></label><div className="calendar-checks">{calendars.map(c => <Check key={c.id} label={c.summary} checked={settings.visibleCalendarIds.includes(c.id)} onChange={() => toggleCalendar(c.id)} color={c.backgroundColor}/>)}</div></section>
      <section><h3>Synchronization</h3><Check label="Automatic sync" checked={settings.automaticSync} onChange={v => patch({automaticSync:v})}/><label>Interval<select value={settings.syncIntervalMinutes} onChange={e => patch({syncIntervalMinutes:Number(e.target.value)})}><option value="5">5 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select></label></section>
      <section><h3>Account</h3>{auth.authenticated ? <><div className="account-card"><div className="avatar">{auth.name?.slice(0,1) || '?'}</div><div><strong>{auth.name || 'Google account'}</strong><small>{auth.email || 'Google account connected'}</small></div></div><button className="danger-button full" onClick={onSignOut}>Sign out</button></> : <button className="primary-button full" onClick={onSignIn}>Sign in with Google</button>}</section>
      <section><h3>About</h3><p className="muted">Calendar Gadget 0.1.0</p><p className="muted">Google Calendar remains the source of truth. Local data is a cache.</p></section>
    </div>
  </aside></div>;
}
function Check({label, checked, onChange, color}: {label:string;checked:boolean;onChange:(v:boolean)=>void;color?:string}) { return <label className="check-row"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span className="color-dot" style={{background:color || 'var(--accent)'}}/><span>{label}</span></label>; }
