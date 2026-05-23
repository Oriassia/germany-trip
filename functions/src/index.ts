import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

admin.initializeApp();

/** v2 callable requires explicit CORS for browser clients (e.g. Vite dev server). */
const callableOpts = { cors: true, region: 'us-central1' as const };

const db = admin.firestore();
const auth = admin.auth();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function assertOwner(tripId: string, uid: string): Promise<void> {
  const member = await db.doc(`trips/${tripId}/members/${uid}`).get();
  if (!member.exists || member.data()?.role !== 'owner') {
    throw new HttpsError('permission-denied', 'רק בעלים יכול לבצע פעולה זו');
  }
}

async function addMemberToTrip(
  tripId: string,
  uid: string,
  role: 'editor' | 'viewer',
  email: string,
  displayName: string,
  addedBy: string,
): Promise<void> {
  const tripSnap = await db.doc(`trips/${tripId}`).get();
  if (!tripSnap.exists) {
    throw new HttpsError('not-found', 'טיול לא נמצא');
  }
  const title = (tripSnap.data()?.title as string) ?? 'טיול';
  const now = admin.firestore.FieldValue.serverTimestamp();

  const batch = db.batch();
  batch.set(db.doc(`trips/${tripId}/members/${uid}`), {
    role,
    email,
    displayName,
    addedAt: now,
    addedBy,
  });
  batch.set(db.doc(`users/${uid}/memberships/${tripId}`), {
    role,
    title,
    updatedAt: now,
  });
  await batch.commit();
}

export const inviteToTrip = onCall(callableOpts, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'יש להתחבר');
  }

  const { tripId, email, role } = request.data as {
    tripId?: string;
    email?: string;
    role?: 'editor' | 'viewer';
  };

  if (!tripId || !email || !role || !['editor', 'viewer'].includes(role)) {
    throw new HttpsError('invalid-argument', 'פרמטרים חסרים');
  }

  await assertOwner(tripId, request.auth.uid);
  const normalized = normalizeEmail(email);

  const existingMember = await db
    .collection(`trips/${tripId}/members`)
    .where('email', '==', normalized)
    .limit(1)
    .get();

  if (!existingMember.empty) {
    return { status: 'exists', message: 'כבר חבר בטיול' };
  }

  try {
    const user = await auth.getUserByEmail(normalized);
    const memberDoc = await db.doc(`trips/${tripId}/members/${user.uid}`).get();
    if (memberDoc.exists) {
      return { status: 'exists', message: 'כבר חבר בטיול' };
    }

    await addMemberToTrip(
      tripId,
      user.uid,
      role,
      normalized,
      user.displayName ?? '',
      request.auth.uid,
    );

    const pendingInvites = await db
      .collection(`trips/${tripId}/invites`)
      .where('email', '==', normalized)
      .where('status', '==', 'pending')
      .get();

    const batch = db.batch();
    pendingInvites.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'accepted' });
    });
    await batch.commit();

    return { status: 'added', message: 'נוסף לטיול' };
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? (err as { code: string }).code
        : '';
    if (code !== 'auth/user-not-found') {
      throw err;
    }
  }

  await db.collection(`trips/${tripId}/invites`).add({
    email: normalized,
    role,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: request.auth.uid,
  });

  return { status: 'invited', message: 'הוזמן — יתווסף לאחר התחברות' };
});

export const acceptPendingInvites = onCall(callableOpts, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'יש להתחבר');
  }

  const email = request.auth.token.email;
  if (!email) {
    throw new HttpsError('failed-precondition', 'אין אימייל בחשבון');
  }

  const normalized = normalizeEmail(email);
  const uid = request.auth.uid;
  const displayName = (request.auth.token.name as string) ?? '';

  const pending = await db
    .collectionGroup('invites')
    .where('email', '==', normalized)
    .where('status', '==', 'pending')
    .get();

  let accepted = 0;

  for (const inviteDoc of pending.docs) {
    const tripId = inviteDoc.ref.parent.parent?.id;
    if (!tripId) continue;

    const invite = inviteDoc.data();
    const role = invite.role as 'editor' | 'viewer';

    const memberDoc = await db.doc(`trips/${tripId}/members/${uid}`).get();
    if (!memberDoc.exists) {
      await addMemberToTrip(
        tripId,
        uid,
        role,
        normalized,
        displayName,
        invite.createdBy as string,
      );
      accepted++;
    }

    await inviteDoc.ref.update({ status: 'accepted' });
  }

  return { accepted };
});

export const revokeInvite = onCall(callableOpts, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'יש להתחבר');
  }

  const { tripId, inviteId } = request.data as {
    tripId?: string;
    inviteId?: string;
  };

  if (!tripId || !inviteId) {
    throw new HttpsError('invalid-argument', 'פרמטרים חסרים');
  }

  await assertOwner(tripId, request.auth.uid);
  await db.doc(`trips/${tripId}/invites/${inviteId}`).update({
    status: 'revoked',
  });
});

export const removeMember = onCall(callableOpts, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'יש להתחבר');
  }

  const { tripId, memberUid } = request.data as {
    tripId?: string;
    memberUid?: string;
  };

  if (!tripId || !memberUid) {
    throw new HttpsError('invalid-argument', 'פרמטרים חסרים');
  }

  await assertOwner(tripId, request.auth.uid);

  if (memberUid === request.auth.uid) {
    throw new HttpsError('invalid-argument', 'לא ניתן להסיר את עצמך כבעלים');
  }

  const member = await db.doc(`trips/${tripId}/members/${memberUid}`).get();
  if (!member.exists) {
    throw new HttpsError('not-found', 'חבר לא נמצא');
  }
  if (member.data()?.role === 'owner') {
    throw new HttpsError('invalid-argument', 'לא ניתן להסיר בעלים');
  }

  const batch = db.batch();
  batch.delete(db.doc(`trips/${tripId}/members/${memberUid}`));
  batch.delete(db.doc(`users/${memberUid}/memberships/${tripId}`));
  await batch.commit();
});

export const deleteTrip = onCall(callableOpts, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'יש להתחבר');
  }

  const { tripId } = request.data as { tripId?: string };
  if (!tripId) {
    throw new HttpsError('invalid-argument', 'חסר tripId');
  }

  await assertOwner(tripId, request.auth.uid);

  const members = await db.collection(`trips/${tripId}/members`).get();
  const invites = await db.collection(`trips/${tripId}/invites`).get();

  const batch = db.batch();

  members.docs.forEach((m) => {
    batch.delete(m.ref);
    batch.delete(db.doc(`users/${m.id}/memberships/${tripId}`));
  });

  invites.docs.forEach((inv) => batch.delete(inv.ref));
  batch.delete(db.doc(`trips/${tripId}`));

  await batch.commit();
});
