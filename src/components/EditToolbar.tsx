import { useRef, type CSSProperties } from 'react';
import { useTripContext } from '../context/TripContext';

interface EditToolbarProps {
  onOpenSearch: () => void;
}

export function EditToolbar({ onOpenSearch }: EditToolbarProps) {
  const { toolbarMsg, exportData, importFromFile, resetAll } = useTripContext();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div
        id="edit-bar"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#26215C',
          color: '#EEEDFE',
          padding: '10px 20px',
          borderRadius: 50,
          fontSize: '0.85rem',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          boxShadow: '0 6px 28px rgba(38,33,92,0.4)',
          zIndex: 9999,
        }}
      >
        <span
          id="edit-label"
          style={{ fontSize: '0.82rem', color: '#AFA9EC' }}
        >
          {toolbarMsg}
        </span>
        <div
          style={{
            width: 1,
            height: 18,
            background: 'rgba(255,255,255,0.2)',
          }}
        />
        <button
          type="button"
          onClick={exportData}
          style={toolbarBtnStyle}
        >
          📤 ייצוא
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={toolbarBtnStyle}
        >
          📥 ייבוא
        </button>
        <button
          type="button"
          onClick={resetAll}
          style={{
            ...toolbarBtnStyle,
            background: 'rgba(255,80,80,0.25)',
            color: '#ffaaaa',
          }}
        >
          ↩ אפס
        </button>
        <div
          style={{
            width: 1,
            height: 18,
            background: 'rgba(255,255,255,0.2)',
          }}
        />
        <button
          type="button"
          onClick={onOpenSearch}
          style={{ ...toolbarBtnStyle, background: 'rgba(255,255,255,0.15)' }}
        >
          🔍 חיפוש
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importFromFile(file);
          e.target.value = '';
        }}
      />
    </>
  );
}

const toolbarBtnStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.12)',
  border: 'none',
  color: '#EEEDFE',
  padding: '5px 13px',
  borderRadius: 20,
  cursor: 'pointer',
  fontSize: '0.8rem',
};
