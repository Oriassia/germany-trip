import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { fsLog, fsStep } from '../lib/firestoreDebug';
import type { InviteRole } from '../types/trip';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function userInviteRef(email: string, tripId: string) {
  return doc(db, 'userInvites', normalizeEmail(email), 'trips', tripId);
}

async function addMemberToTrip(
  tripId: string,
  uid: string,
  role: InviteRole,
  email: string,
  displayName: string,
  addedBy: string,
  title: string,
): Promise<void> {
  const now = serverTimestamp();
  const batch = writeBatch(db);
  batch.set(doc(db, 'trips', tripId, 'members', uid), {
    role,
    email,
    displayName,
    addedAt: now,
    addedBy,
  });
  batch.set(doc(db, 'users', uid, 'memberships', tripId), {
    role,
    title,
    updatedAt: now,
  });
  await batch.commit();
}

export async function inviteToTrip(
  tripId: string,
  email: string,
  role: InviteRole,
  invitedBy: string,
): Promise<{ status: string; message?: string }> {
  const normalized = normalizeEmail(email);

  fsLog('inviteToTrip', { tripId, invitedBy, email: normalized, role });

  await fsStep(
    'invite.verifyCallerMember',
    { path: `trips/${tripId}/members/${invitedBy}` },
    async () => {
      const snap = await getDoc(doc(db, 'trips', tripId, 'members', invitedBy));
      fsLog('invite.verifyCallerMember → doc', {
        exists: snap.exists(),
        role: snap.data()?.role,
      });
      if (!snap.exists()) {
        throw new Error('אין מסמך חבר — לא ניתן להזמין');
      }
      if (snap.data()?.role !== 'owner') {
        throw new Error(`רק בעלים יכול להזמין (role=${snap.data()?.role})`);
      }
    },
  );

  const existingMember = await fsStep(
    'invite.queryExistingMember',
    { path: `trips/${tripId}/members`, filter: { email: normalized } },
    () =>
      getDocs(
        query(
          collection(db, 'trips', tripId, 'members'),
          where('email', '==', normalized),
          limit(1),
        ),
      ),
  );
  if (!existingMember.empty) {
    return { status: 'exists', message: 'כבר חבר בטיול' };
  }

  const pendingInvite = await fsStep(
    'invite.queryPendingInvite',
    { path: `trips/${tripId}/invites`, filter: { email: normalized, status: 'pending' } },
    () =>
      getDocs(
        query(
          collection(db, 'trips', tripId, 'invites'),
          where('email', '==', normalized),
          where('status', '==', 'pending'),
          limit(1),
        ),
      ),
  );
  if (!pendingInvite.empty) {
    return { status: 'exists', message: 'כבר קיימת הזמנה ממתינה' };
  }

  const tripSnap = await getDoc(doc(db, 'trips', tripId));
  const tripTitle = (tripSnap.data()?.title as string) ?? 'טיול';
  const now = serverTimestamp();

  await fsStep(
    'invite.createInviteDocs',
    { paths: [`trips/${tripId}/invites`, `userInvites/${normalized}/trips/${tripId}`] },
    async () => {
      const inviteRef = doc(collection(db, 'trips', tripId, 'invites'));
      const payload = {
        email: normalized,
        role,
        title: tripTitle,
        status: 'pending' as const,
        createdAt: now,
        createdBy: invitedBy,
      };
      const batch = writeBatch(db);
      batch.set(inviteRef, payload);
      batch.set(userInviteRef(normalized, tripId), {
        ...payload,
        tripId,
        tripInviteId: inviteRef.id,
      });
      await batch.commit();
    },
  );

  return {
    status: 'invited',
    message: 'הוזמן — יתווסף לאחר התחברות עם אותו אימייל',
  };
}

async function inviteeEmailFromUser(user: User): Promise<string> {
  await user.getIdToken();
  const tokenEmail = (await user.getIdTokenResult()).claims.email;
  const email = typeof tokenEmail === 'string' ? tokenEmail : user.email;
  if (!email) {
    throw new Error('אין אימייל בחשבון');
  }
  return normalizeEmail(email);
}

export async function acceptPendingInvites(user: User): Promise<{ accepted: number }> {
  const normalized = await inviteeEmailFromUser(user);
  fsLog('acceptPendingInvites', {
    uid: user.uid,
    email: normalized,
    tokenEmail: normalized,
  });

  const pending = await fsStep(
    'accept.queryUserInvites',
    {
      path: `userInvites/${normalized}/trips`,
      filter: { email: normalized, status: 'pending' },
    },
    () =>
      getDocs(
        query(
          collection(db, 'userInvites', normalized, 'trips'),
          where('email', '==', normalized),
          where('status', '==', 'pending'),
        ),
      ),
  );

  let accepted = 0;
  const displayName = user.displayName ?? '';

  for (const inboxDoc of pending.docs) {
    const tripId = inboxDoc.id;
    const invite = inboxDoc.data();
    const role = invite.role as InviteRole;
    const title = (invite.title as string) ?? 'טיול';
    const tripInviteId = invite.tripInviteId as string | undefined;

    const memberDoc = await getDoc(doc(db, 'trips', tripId, 'members', user.uid));
    if (!memberDoc.exists()) {
      await fsStep(
        'accept.addMember',
        { tripId, uid: user.uid, role },
        () =>
          addMemberToTrip(
            tripId,
            user.uid,
            role,
            normalized,
            displayName,
            (invite.createdBy as string) ?? user.uid,
            title,
          ),
      );
      accepted++;
    }

    await fsStep('accept.markInviteAccepted', { tripId }, async () => {
      const batch = writeBatch(db);
      batch.update(inboxDoc.ref, { status: 'accepted' });
      if (tripInviteId) {
        batch.update(doc(db, 'trips', tripId, 'invites', tripInviteId), {
          status: 'accepted',
        });
      }
      await batch.commit();
    });
  }

  return { accepted };
}

export async function revokeInvite(tripId: string, inviteId: string): Promise<void> {
  await fsStep('revokeInvite', { tripId, inviteId }, async () => {
    const inviteSnap = await getDoc(doc(db, 'trips', tripId, 'invites', inviteId));
    const email = inviteSnap.data()?.email as string | undefined;

    const batch = writeBatch(db);
    batch.update(doc(db, 'trips', tripId, 'invites', inviteId), { status: 'revoked' });
    if (email) {
      batch.update(userInviteRef(email, tripId), { status: 'revoked' });
    }
    await batch.commit();
  });
}

export async function removeMember(tripId: string, memberUid: string): Promise<void> {
  const memberDoc = await getDoc(doc(db, 'trips', tripId, 'members', memberUid));
  if (!memberDoc.exists()) {
    throw new Error('חבר לא נמצא');
  }
  if (memberDoc.data()?.role === 'owner') {
    throw new Error('לא ניתן להסיר בעלים');
  }

  await fsStep('removeMember', { tripId, memberUid }, async () => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'trips', tripId, 'members', memberUid));
    batch.delete(doc(db, 'users', memberUid, 'memberships', tripId));
    await batch.commit();
  });
}

export async function deleteTrip(tripId: string): Promise<void> {
  await fsStep('deleteTrip', { tripId }, async () => {
    const members = await getDocs(collection(db, 'trips', tripId, 'members'));
    const invites = await getDocs(collection(db, 'trips', tripId, 'invites'));

    const batch = writeBatch(db);
    members.docs.forEach((m) => {
      batch.delete(m.ref);
      batch.delete(doc(db, 'users', m.id, 'memberships', tripId));
    });
    invites.docs.forEach((inv) => {
      batch.delete(inv.ref);
      const email = inv.data().email as string | undefined;
      if (email) {
        batch.delete(userInviteRef(email, tripId));
      }
    });
    batch.delete(doc(db, 'trips', tripId));
    await batch.commit();
  });
}
