import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { EMPTY_TRIP_PAYLOAD } from '../lib/emptyTrip';
import type { TripRole } from '../types/trip';

export async function createTrip(user: User): Promise<string> {
  const now = serverTimestamp();
  const tripRef = await addDoc(collection(db, 'trips'), {
    ...EMPTY_TRIP_PAYLOAD,
    createdBy: user.uid,
    createdAt: now,
    updatedAt: now,
  });

  const batch = writeBatch(db);

  batch.set(doc(db, 'trips', tripRef.id, 'members', user.uid), {
    role: 'owner' as TripRole,
    email: (user.email ?? '').trim().toLowerCase(),
    displayName: user.displayName ?? '',
    addedAt: now,
    addedBy: user.uid,
  });

  batch.set(doc(db, 'users', user.uid, 'memberships', tripRef.id), {
    role: 'owner' as TripRole,
    title: EMPTY_TRIP_PAYLOAD.title,
    updatedAt: now,
  });

  batch.set(
    doc(db, 'users', user.uid),
    { lastActiveTripId: tripRef.id },
    { merge: true },
  );

  await batch.commit();
  return tripRef.id;
}

export async function setLastActiveTrip(
  uid: string,
  tripId: string,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { lastActiveTripId: tripId });
}

export async function leaveTrip(uid: string, tripId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'trips', tripId, 'members', uid));
  batch.delete(doc(db, 'users', uid, 'memberships', tripId));
  await batch.commit();
}
