import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserTripListItem } from '../hooks/useUserTrips';
import { createTrip, leaveTrip, setLastActiveTrip } from '../services/trips';
import { deleteTrip } from '../services/invites';

const ROLE_LABELS: Record<string, string> = {
  owner: 'בעלים',
  editor: 'עורך',
  viewer: 'צופה',
};

interface TripListProps {
  trips: UserTripListItem[];
}

export function TripList({ trips }: TripListProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!user || creating) return;
    setCreating(true);
    try {
      const tripId = await createTrip(user);
      navigate(`/trips/${tripId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'שגיאה ביצירת טיול');
    } finally {
      setCreating(false);
    }
  };

  const handleOpen = async (tripId: string) => {
    if (!user) return;
    await setLastActiveTrip(user.uid, tripId);
    navigate(`/trips/${tripId}`);
  };

  const handleLeave = async (tripId: string) => {
    if (!user) return;
    if (!confirm('לעזוב את הטיול? לא תוכל לצפות בו יותר.')) return;
    setBusyId(tripId);
    try {
      await leaveTrip(user.uid, tripId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm('למחוק את הטיול לצמיתות? פעולה בלתי הפיכה.')) return;
    setBusyId(tripId);
    try {
      await deleteTrip(tripId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'שגיאה במחיקה');
    } finally {
      setBusyId(null);
    }
  };

  if (trips.length === 0) {
    return (
      <div className="trips-empty">
        <p>אין טיולים — צור טיול חדש</p>
        <button
          type="button"
          className="trips-create-btn"
          onClick={() => void handleCreate()}
          disabled={creating}
        >
          {creating ? 'יוצר...' : '+ טיול חדש'}
        </button>
      </div>
    );
  }

  return (
    <div className="trips-list">
      <button
        type="button"
        className="trips-create-btn"
        onClick={() => void handleCreate()}
        disabled={creating}
      >
        {creating ? 'יוצר...' : '+ טיול חדש'}
      </button>
      <ul className="trips-list__items">
        {trips.map((t) => (
          <li key={t.tripId} className="trips-list__item">
            <button
              type="button"
              className="trips-list__open"
              onClick={() => void handleOpen(t.tripId)}
              disabled={busyId === t.tripId}
            >
              <span className="trips-list__title">{t.title}</span>
              <span className={`trips-list__role trips-list__role--${t.role}`}>
                {ROLE_LABELS[t.role] ?? t.role}
              </span>
            </button>
            <div className="trips-list__actions">
              {t.role === 'owner' ? (
                <button
                  type="button"
                  className="trips-list__action trips-list__action--danger"
                  onClick={() => void handleDelete(t.tripId)}
                  disabled={busyId === t.tripId}
                >
                  מחק
                </button>
              ) : (
                <button
                  type="button"
                  className="trips-list__action"
                  onClick={() => void handleLeave(t.tripId)}
                  disabled={busyId === t.tripId}
                >
                  עזוב
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
