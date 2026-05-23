import { useRef } from 'react';
import { useTripContext } from '../context/TripContext';

interface EditToolbarProps {
  onOpenSearch: () => void;
}

export function EditToolbar({ onOpenSearch }: EditToolbarProps) {
  const {
    toolbarMsg,
    canEdit,
    canManage,
    exportData,
    importFromFile,
    clearAllDays,
    setShareOpen,
  } = useTripContext();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!canEdit && !canManage) {
    return (
      <div id="edit-bar" className="edit-toolbar edit-toolbar--readonly">
        <span id="edit-label" className="edit-toolbar__label">
          {toolbarMsg} · צפייה בלבד
        </span>
        <div className="edit-toolbar__divider" />
        <button
          type="button"
          className="edit-toolbar__btn edit-toolbar__btn--search"
          onClick={onOpenSearch}
        >
          🔍 חיפוש
        </button>
      </div>
    );
  }

  return (
    <>
      <div id="edit-bar" className="edit-toolbar">
        <span id="edit-label" className="edit-toolbar__label">
          {toolbarMsg}
        </span>
        <div className="edit-toolbar__divider" />
        <button type="button" className="edit-toolbar__btn" onClick={exportData}>
          📤 ייצוא
        </button>
        <button
          type="button"
          className="edit-toolbar__btn"
          onClick={() => fileRef.current?.click()}
        >
          📥 ייבוא
        </button>
        <button
          type="button"
          className="edit-toolbar__btn edit-toolbar__btn--danger"
          onClick={clearAllDays}
        >
          🗑️ מחק ימים
        </button>
        {canManage && (
          <button
            type="button"
            className="edit-toolbar__btn"
            onClick={() => setShareOpen(true)}
          >
            👥 שיתוף
          </button>
        )}
        <div className="edit-toolbar__divider" />
        <button
          type="button"
          className="edit-toolbar__btn edit-toolbar__btn--search"
          onClick={onOpenSearch}
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
