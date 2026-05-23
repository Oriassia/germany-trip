import { useEffect, useState } from 'react';
import type { Day } from '../types/trip';

interface RouteEditPanelProps {
  days: Day[];
  routeEndLabel: string;
  open: boolean;
  onSave: (
    routePoints: { dayId: string; routePoint: string }[],
    routeEndLabel: string,
  ) => void;
  onSync: () => void;
  onCancel: () => void;
}

export function RouteEditPanel({
  days,
  routeEndLabel,
  open,
  onSave,
  onSync,
  onCancel,
}: RouteEditPanelProps) {
  const [points, setPoints] = useState<{ dayId: string; routePoint: string }[]>(
    [],
  );
  const [endLabel, setEndLabel] = useState(routeEndLabel);

  useEffect(() => {
    if (open) {
      setPoints(
        days.map((d) => ({ dayId: d.id, routePoint: d.routePoint })),
      );
      setEndLabel(routeEndLabel);
    }
  }, [open, days, routeEndLabel]);

  const setPoint = (dayId: string, routePoint: string) => {
    setPoints((prev) =>
      prev.map((p) => (p.dayId === dayId ? { ...p, routePoint } : p)),
    );
  };

  return (
    <div className={`route-edit-panel day-edit-panel${open ? ' open' : ''}`}>
      {days.map((day, i) => {
        const point = points.find((p) => p.dayId === day.id);
        return (
          <div className="fld" key={day.id}>
            <label>
              יום {i + 1} – {day.dayName}
              {day.date ? ` (${day.date})` : ''}
            </label>
            <input
              value={point?.routePoint ?? ''}
              onChange={(e) => setPoint(day.id, e.target.value)}
            />
          </div>
        );
      })}
      <div className="fld">
        <label>נקודת סיום (שדה תעופה וכו׳)</label>
        <input value={endLabel} onChange={(e) => setEndLabel(e.target.value)} />
      </div>
      <div className="edit-panel-actions">
        <button
          type="button"
          className="btn-save"
          onClick={() => onSave(points, endLabel)}
        >
          ✓ שמור
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          ✕ בטל
        </button>
        <button type="button" className="btn-sync" onClick={onSync}>
          ↻ סנכרן ממסלולי הימים
        </button>
      </div>
    </div>
  );
}
