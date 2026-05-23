import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { useTripContext } from '../context/TripContext';
import type { InviteRole, TripInvite, TripMember, TripRole } from '../types/trip';
import { useAuth } from '../context/AuthContext';
import { FirestoreStepError, fsLogError } from '../lib/firestoreDebug';
import { inviteToTrip, removeMember, revokeInvite } from '../services/invites';

const ROLE_LABELS: Record<TripRole | InviteRole, string> = {
  owner: 'בעלים',
  editor: 'עורך',
  viewer: 'צופה',
};

interface MemberRow {
  uid: string;
  role: TripRole;
  email: string;
  displayName?: string;
}

interface InviteRow {
  id: string;
  email: string;
  role: InviteRole;
}

export function SharePanel() {
  const { user } = useAuth();
  const { tripId, canManage, shareOpen, setShareOpen } = useTripContext();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>('editor');
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!canManage || !shareOpen) return;

    const unsubMembers = onSnapshot(
      collection(db, 'trips', tripId, 'members'),
      (snap) => {
        setMembers(
          snap.docs.map((d) => {
            const data = d.data() as TripMember;
            return {
              uid: d.id,
              role: data.role,
              email: data.email,
              displayName: data.displayName,
            };
          }),
        );
      },
      (err) => fsLogError('sharePanel.onSnapshot.members', err),
    );

    const unsubInvites = onSnapshot(
      query(
        collection(db, 'trips', tripId, 'invites'),
        where('status', '==', 'pending'),
      ),
      (snap) => {
        setInvites(
          snap.docs.map((d) => {
            const data = d.data() as TripInvite;
            return { id: d.id, email: data.email, role: data.role };
          }),
        );
      },
      (err) => fsLogError('sharePanel.onSnapshot.invites', err),
    );

    return () => {
      unsubMembers();
      unsubInvites();
    };
  }, [tripId, canManage, shareOpen]);

  if (!canManage) return null;

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    setMessage(null);
    try {
      if (!user) return;
      const result = await inviteToTrip(tripId, trimmed, role, user.uid);
      setMessage(result.message ?? (result.status === 'invited' ? 'הוזמן' : 'נוסף לטיול'));
      setEmail('');
    } catch (err) {
      if (err instanceof FirestoreStepError) {
        setMessage(`[${err.step}] ${err.message}`);
      } else {
        setMessage(err instanceof Error ? err.message : 'שגיאה');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!shareOpen) return null;

  return (
    <div className="share-overlay" onClick={() => setShareOpen(false)}>
      <div className="share-panel" onClick={(e) => e.stopPropagation()}>
        <div className="share-panel__header">
          <h2>שיתוף טיול</h2>
          <button type="button" className="share-panel__close" onClick={() => setShareOpen(false)}>
            ✕
          </button>
        </div>

        <div className="share-panel__form">
          <input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as InviteRole)}>
            <option value="editor">עורך</option>
            <option value="viewer">צופה</option>
          </select>
          <button type="button" onClick={() => void handleInvite()} disabled={busy}>
            {busy ? '...' : 'הזמן'}
          </button>
        </div>
        {message && <p className="share-panel__msg">{message}</p>}

        <h3>חברים</h3>
        <ul className="share-panel__list">
          {members.map((m) => (
            <li key={m.uid}>
              <span>
                {m.displayName || m.email}
                <span className="share-panel__role">{ROLE_LABELS[m.role]}</span>
              </span>
              {m.role !== 'owner' && (
                <button
                  type="button"
                  onClick={() => void removeMember(tripId, m.uid)}
                  disabled={busy}
                >
                  הסר
                </button>
              )}
            </li>
          ))}
        </ul>

        {invites.length > 0 && (
          <>
            <h3>הזמנות ממתינות</h3>
            <ul className="share-panel__list">
              {invites.map((inv) => (
                <li key={inv.id}>
                  <span>
                    {inv.email}
                    <span className="share-panel__role">{ROLE_LABELS[inv.role]}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void revokeInvite(tripId, inv.id)}
                    disabled={busy}
                  >
                    בטל
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
