import { useEffect, useRef, useState } from 'react';
import { ICON_OPTIONS } from '../constants';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        className="icon-trigger"
        title="בחר אייקון"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {value || '📌'}
      </button>
      <div className={`icon-popup${open ? ' open' : ''}`}>
        {ICON_OPTIONS.map((opt) => (
          <button
            key={opt.icon}
            type="button"
            className={`icon-opt${value === opt.icon ? ' selected' : ''}`}
            title={opt.title}
            onClick={(e) => {
              e.stopPropagation();
              onChange(opt.icon);
              setOpen(false);
            }}
          >
            {opt.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
