import { buildTimeLabel } from '../utils/time';

interface TimePickerRowProps {
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}

export function TimePickerRow({
  start,
  end,
  onStartChange,
  onEndChange,
}: TimePickerRowProps) {
  const preview = buildTimeLabel(start, end) || '—';

  return (
    <div className="time-picker">
      <input
        type="time"
        value={start}
        onChange={(e) => onStartChange(e.target.value)}
      />
      <span className="time-sep">–</span>
      <input
        type="time"
        value={end}
        onChange={(e) => onEndChange(e.target.value)}
      />
      <span className="time-preview">{preview}</span>
    </div>
  );
}
