import { useState, type MouseEvent } from 'react';
import { useTripContext } from '../context/TripContext';
import type { Day } from '../types/trip';
import { ActivityItem } from './ActivityItem';
import { ActivityTimelineAdd } from './ActivityTimelineAdd';
import { DayEditPanel } from './DayEditPanel';

interface DayCardProps {
  day: Day;
  dayNum: number;
}

export function DayCard({ day, dayNum }: DayCardProps) {
  const {
    canEdit,
    editDayId,
    setEditDayId,
    saveDay,
    removeDay,
    addActivity,
  } = useTripContext();
  const [collapsed, setCollapsed] = useState(false);
  const dayEditOpen = editDayId === day.id;
  const dayColorIndex = (dayNum - 1) % 4;

  const toggleCollapse = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.day-edit-btn, .day-drag-handle')) return;
    setCollapsed((c) => !c);
  };

  return (
    <div
      className={`day-card${collapsed ? ' collapsed' : ''}`}
      id={`card-${day.id}`}
      data-dayid={day.id}
    >
      <div className="day-header" onClick={toggleCollapse}>
        {canEdit && (
          <span
            className="day-drag-handle"
            title="גרור לשינוי סדר ימים"
            onClick={(e) => e.stopPropagation()}
          >
            ⠿
          </span>
        )}
        <div
          className="day-num"
          data-day-color={dayColorIndex}
        >
          {dayNum}
        </div>
        <div className="day-title">
          <h2>{day.route}</h2>
          <div className="sub">
            {day.dayName}, {day.date} · {day.km} ק&quot;מ · לינה:{' '}
            {day.hotel || '—'}
          </div>
        </div>
        {canEdit && (
          <button
            type="button"
            className={`day-edit-btn${dayEditOpen ? ' open' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setEditDayId(dayEditOpen ? null : day.id);
            }}
          >
            ✏️ ערוך
          </button>
        )}
        <span className="day-chevron">▼</span>
      </div>

      <DayEditPanel
        day={day}
        open={dayEditOpen}
        onSave={(updates) => saveDay(day.id, updates)}
        onCancel={() => setEditDayId(null)}
        onDelete={() => removeDay(day.id)}
      />

      <div className="day-body" id={`db-${day.id}`}>
        {day.activities.length === 0 && canEdit && (
          <ActivityTimelineAdd
            insertAt={0}
            onInsert={(at) => addActivity(day.id, at)}
          />
        )}
        {day.activities.map((act, index) => (
          <ActivityItem
            key={`${day.id}-${act.id}`}
            dayId={day.id}
            activity={act}
            index={index}
          />
        ))}
        {day.navUrl && (
          <a
            className="dir-btn"
            href={day.navUrl}
            target="_blank"
            rel="noreferrer"
          >
            🗺️ נווט יום זה
          </a>
        )}
      </div>
    </div>
  );
}
