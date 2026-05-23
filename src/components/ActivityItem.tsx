import { useTripContext } from '../context/TripContext';
import type { Activity } from '../types/trip';
import { ActivityEditPanel } from './ActivityEditPanel';

interface ActivityItemProps {
  dayId: string;
  activity: Activity;
}

export function ActivityItem({ dayId, activity }: ActivityItemProps) {
  const {
    canEdit,
    editActKey,
    setEditActKey,
    saveActivity,
    deleteActivity,
  } = useTripContext();
  const actKey = `${dayId}:${activity.id}`;
  const open = editActKey === actKey;

  return (
    <div
      className="act-wrapper"
      id={`aw-${dayId}-${activity.id}`}
      data-dayid={dayId}
      data-actid={activity.id}
    >
      <div className="timeline-item">
        {canEdit && (
          <span className="tl-handle" title="גרור לסידור מחדש">
            ⠿
          </span>
        )}
        <div className="tl-left">
          <div className="tl-icon">{activity.icon}</div>
          <div className="tl-line" />
        </div>
        <div className="tl-content">
          <div className="tl-time">{activity.time}</div>
          <div className="tl-title">{activity.title}</div>
          <div className="tl-desc">{activity.desc}</div>
          {activity.mapUrl && (
            <a
              className="map-tag"
              href={activity.mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              📍 פתח ב-Maps
            </a>
          )}
        </div>
        {canEdit && (
          <button
            type="button"
            className={`act-edit-btn${open ? ' open' : ''}`}
            onClick={() => setEditActKey(open ? null : actKey)}
          >
            ✏️
          </button>
        )}
      </div>

      <ActivityEditPanel
        activity={activity}
        open={open}
        onSave={(updates) => saveActivity(dayId, activity.id, updates)}
        onCancel={() => setEditActKey(null)}
        onDelete={() => deleteActivity(dayId, activity.id)}
      />
    </div>
  );
}
