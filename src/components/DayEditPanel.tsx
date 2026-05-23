import { useEffect, useState } from 'react';
import type { Day } from '../types/trip';

interface DayEditPanelProps {
  day: Day;
  open: boolean;
  onSave: (updates: Partial<Day>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function DayEditPanel({
  day,
  open,
  onSave,
  onCancel,
  onDelete,
}: DayEditPanelProps) {
  const [form, setForm] = useState({
    dayName: day.dayName,
    date: day.date,
    route: day.route,
    km: day.km,
    hotel: day.hotel,
    hotelUrl: day.hotelUrl,
    navUrl: day.navUrl,
  });

  useEffect(() => {
    if (open) {
      setForm({
        dayName: day.dayName,
        date: day.date,
        route: day.route,
        km: day.km,
        hotel: day.hotel,
        hotelUrl: day.hotelUrl,
        navUrl: day.navUrl,
      });
    }
  }, [open, day]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className={`day-edit-panel${open ? ' open' : ''}`}>
      <div className="form-row2">
        <div className="fld">
          <label>יום בשבוע</label>
          <input
            value={form.dayName}
            onChange={(e) => set('dayName', e.target.value)}
          />
        </div>
        <div className="fld">
          <label>תאריך</label>
          <input value={form.date} onChange={(e) => set('date', e.target.value)} />
        </div>
      </div>
      <div className="fld">
        <label>מסלול (כותרת)</label>
        <input value={form.route} onChange={(e) => set('route', e.target.value)} />
      </div>
      <div className="form-row2">
        <div className="fld">
          <label>מרחק</label>
          <input value={form.km} onChange={(e) => set('km', e.target.value)} />
        </div>
        <div className="fld">
          <label>מקום לינה</label>
          <input
            value={form.hotel}
            onChange={(e) => set('hotel', e.target.value)}
          />
        </div>
      </div>
      <div className="fld">
        <label>Maps ללינה</label>
        <input
          value={form.hotelUrl}
          onChange={(e) => set('hotelUrl', e.target.value)}
          dir="ltr"
          placeholder="https://maps.google.com/..."
        />
      </div>
      <div className="fld">
        <label>קישור ניווט יומי</label>
        <input
          value={form.navUrl}
          onChange={(e) => set('navUrl', e.target.value)}
          dir="ltr"
          placeholder="https://www.google.com/maps/dir/..."
        />
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          paddingTop: 4,
        }}
      >
        <button type="button" className="btn-save" onClick={() => onSave(form)}>
          ✓ שמור
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          ✕ בטל
        </button>
        <button type="button" className="btn-danger" onClick={onDelete}>
          🗑️ מחק יום
        </button>
      </div>
    </div>
  );
}
