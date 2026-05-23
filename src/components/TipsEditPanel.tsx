import { useEffect, useState } from 'react';
import type { Tip } from '../types/trip';

interface TipsEditPanelProps {
  tips: Tip[];
  tipsSectionTitle: string;
  open: boolean;
  onSave: (tips: Tip[], tipsSectionTitle: string) => void;
  onCancel: () => void;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function TipsEditPanel({
  tips,
  tipsSectionTitle,
  open,
  onSave,
  onCancel,
}: TipsEditPanelProps) {
  const [title, setTitle] = useState(tipsSectionTitle);
  const [rows, setRows] = useState<Tip[]>(tips);

  useEffect(() => {
    if (open) {
      setTitle(tipsSectionTitle);
      setRows(tips.map((t) => ({ ...t })));
    }
  }, [open, tips, tipsSectionTitle]);

  const updateRow = (id: string, patch: Partial<Tip>) => {
    setRows((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: 't' + Date.now(), icon: '💡', text: '' },
    ]);
  };

  const removeRow = (id: string) => {
    if (!confirm('למחוק טיפ זה?')) return;
    setRows((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className={`tips-edit-panel day-edit-panel${open ? ' open' : ''}`}>
      <div className="fld">
        <label>כותרת הסעיף</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      {rows.map((tip, index) => (
        <div className="tip-edit-row" key={tip.id}>
          <div className="tip-edit-row-head">
            <span className="tip-edit-row-num">#{index + 1}</span>
            <div className="tip-edit-row-actions">
              <button
                type="button"
                className="btn-icon"
                title="הזז למעלה"
                disabled={index === 0}
                onClick={() =>
                  setRows((prev) => moveItem(prev, index, index - 1))
                }
              >
                ↑
              </button>
              <button
                type="button"
                className="btn-icon"
                title="הזז למטה"
                disabled={index === rows.length - 1}
                onClick={() =>
                  setRows((prev) => moveItem(prev, index, index + 1))
                }
              >
                ↓
              </button>
              <button
                type="button"
                className="btn-danger-sm"
                onClick={() => removeRow(tip.id)}
              >
                🗑️
              </button>
            </div>
          </div>
          <div className="form-row2">
            <div className="fld fld-icon">
              <label>אייקון</label>
              <input
                value={tip.icon}
                onChange={(e) => updateRow(tip.id, { icon: e.target.value })}
                maxLength={4}
              />
            </div>
            <div className="fld fld-grow">
              <label>טקסט</label>
              <textarea
                value={tip.text}
                onChange={(e) => updateRow(tip.id, { text: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="btn-add-tip" onClick={addRow}>
        + הוסף טיפ
      </button>
      <div className="edit-panel-actions">
        <button
          type="button"
          className="btn-save"
          onClick={() => onSave(rows, title)}
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
