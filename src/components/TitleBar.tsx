import { CalendarDays, Settings2 } from 'lucide-react';

interface Props { onSettings: () => void; onError: (message: string) => void; }

// Minimize / maximize / close are the native Windows controls (decorations: true).
export function TitleBar({ onSettings }: Props) {
  return (
    <div className="titlebar">
      <div className="brand"><CalendarDays size={15} /><span>Calendar</span></div>
      <div className="window-actions">
        <button title="Settings" aria-label="Settings" onClick={onSettings}><Settings2 size={15} /></button>
      </div>
    </div>
  );
}
