interface ActivityTimelineAddProps {
  insertAt: number;
  onInsert: (insertAt: number) => void;
  showHandle?: boolean;
}

export function ActivityTimelineAdd({
  insertAt,
  onInsert,
  showHandle = true,
}: ActivityTimelineAddProps) {
  return (
    <div className="timeline-insert">
      {showHandle && <span className="tl-handle tl-handle--spacer" aria-hidden />}
      <div className="tl-left">
        <div className="tl-connector tl-connector--insert">
          <div className="tl-line" />
          <button
            type="button"
            className="add-act-icon-btn"
            onClick={() => onInsert(insertAt)}
            aria-label="הוסף פעילות"
            title="הוסף פעילות"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
