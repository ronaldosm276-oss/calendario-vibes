import { CalendarDays, Minus, Settings2, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface Props { onSettings: () => void; }

export function TitleBar({ onSettings }: Props) {
  const minimize = async () => getCurrentWindow().minimize();
  const close = async () => getCurrentWindow().hide();
  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="brand" data-tauri-drag-region><CalendarDays size={15} /><span>Calendar</span></div>
      <div className="window-actions">
        <button title="Settings" onClick={onSettings}><Settings2 size={15} /></button>
        <button title="Minimize" onClick={minimize}><Minus size={15} /></button>
        
        <button title="Hide" onClick={close}><X size={15} /></button>
      </div>
    </div>
  );
}
