import { useEffect, useState } from 'react';
import type { Activity } from '../types/trip';
import { buildTimeLabel, parseTimeStr, timePeriod } from '../utils/time';
import { IconPicker } from './IconPicker';
import { TimePickerRow } from './TimePickerRow';

interface ActivityEditPanelProps {
  activity: Activity;
  open: boolean;
  onSave: (updates: Partial<Activity>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function ActivityEditPanel({
  activity,
  open,
  onSave,
  onCancel,
  onDelete,
}: ActivityEditPanelProps) {
  const parsed = parseTimeStr(activity.time);
  const [icon, setIcon] = useState(activity.icon || '📌');
  const [start, setStart] = useState(parsed.start);
  const [end, setEnd] = useState(parsed.end);
  const [title, setTitle] = useState(activity.title);
  const [desc, setDesc] = useState(activity.desc);
  const [mapUrl, setMapUrl] = useState(activity.mapUrl);

  useEffect(() => {
    if (open) {
      const t = parseTimeStr(activity.time);
      setIcon(activity.icon || '📌');
      setStart(t.start);
      setEnd(t.end);
      setTitle(activity.title);
      setDesc(activity.desc);
      setMapUrl(activity.mapUrl);
    }
  }, [open, activity]);

  const handleSave = () => {
    const time =
      buildTimeLabel(start, end) || (start ? `${timePeriod(start)} | ${start}` : '');
    onSave({ icon, time, title, desc, mapUrl });
  };

  return (
    <div className={`act-edit-panel${open ? ' open' : ''}`}>
      <div className="aep-row1">
        <IconPicker value={icon} onChange={setIcon} />
        <TimePickerRow
          start={start}
          end={end}
          onStartChange={setStart}
          onEndChange={setEnd}
        />
      </div>
      <input
        className="aep-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="aep-desc"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <input
        className="aep-map"
        value={mapUrl}
        onChange={(e) => setMapUrl(e.target.value)}
        placeholder="קישור Google Maps (אופציונלי)"
        dir="ltr"
      />
      <div className="aep-actions">
        <button type="button" className="btn-save" onClick={handleSave}>
          ✓ שמור
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          ✕ בטל
        </button>
        <button
          type="button"
          className="btn-danger"
          onClick={onDelete}
          aria-label="מחק פעילות"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
