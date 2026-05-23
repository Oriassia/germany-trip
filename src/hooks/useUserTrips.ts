import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import type { TripMembership, TripRole } from '../types/trip';

export interface UserTripListItem {
  tripId: string;
  title: string;
  role: TripRole;
  updatedAt: TripMembership['updatedAt'] | null;
}

export function useUserTrips(uid: string | undefined) {
  const [trips, setTrips] = useState<UserTripListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setTrips([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'users', uid, 'memberships'),
      orderBy('updatedAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setTrips(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              tripId: d.id,
              title: (data.title as string) ?? 'טיול',
              role: data.role as TripRole,
              updatedAt: data.updatedAt ?? null,
            };
          }),
        );
        setError(null);
        setLoading(false);
      },
      (err) => {
        const msg = err.message;
        setError(
          msg.includes('permission')
            ? 'אין הרשאה לקרוא את רשימת הטיולים. ודא ש-Firestore Rules נפרסו לפרויקט (ראה README).'
            : msg,
        );
        setLoading(false);
      },
    );

    return unsub;
  }, [uid]);

  return { trips, loading, error };
}
