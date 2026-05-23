import { useEffect, useState } from 'react';
import type { TripMeta } from '../types/trip';

interface HeroEditPanelProps {
  meta: TripMeta;
  open: boolean;
  onSave: (updates: Partial<TripMeta>) => void;
  onCancel: () => void;
}

export function HeroEditPanel({
  meta,
  open,
  onSave,
  onCancel,
}: HeroEditPanelProps) {
  const [heroTitle, setHeroTitle] = useState(meta.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(meta.heroSubtitle);

  useEffect(() => {
    if (open) {
      setHeroTitle(meta.heroTitle);
      setHeroSubtitle(meta.heroSubtitle);
    }
  }, [open, meta]);

  return (
    <div className={`hero-edit-panel day-edit-panel${open ? ' open' : ''}`}>
      <div className="fld">
        <label>כותרת ראשית</label>
        <input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
      </div>
      <div className="fld">
        <label>תת-כותרת</label>
        <textarea
          value={heroSubtitle}
          onChange={(e) => setHeroSubtitle(e.target.value)}
          rows={2}
        />
      </div>
      <div className="edit-panel-actions">
        <button
          type="button"
          className="btn-save"
          onClick={() => onSave({ heroTitle, heroSubtitle })}
        >
          ✓ שמור
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          ✕ בטל
        </button>
      </div>
    </div>
  );
}
