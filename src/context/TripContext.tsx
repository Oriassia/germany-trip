import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { DEFAULT_TOOLBAR_LABEL } from '../constants';
import type { Activity, Day, Tip, Trip, TripMeta, TripRole } from '../types/trip';
import { normalizeTrip, routePointFromRoute } from '../utils/normalizeTrip';

function reorderList<T extends { id: string }>(
  items: T[],
  fromId: string,
  toId: string,
  before: boolean,
): T[] {
  const fromIdx = items.findIndex((i) => i.id === fromId);
  let toIdx = items.findIndex((i) => i.id === toId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return items;
  const next = [...items];
  const [item] = next.splice(fromIdx, 1);
  if (fromIdx < toIdx) toIdx--;
  if (!before) toIdx++;
  next.splice(toIdx, 0, item);
  return next;
}

export interface TripContextValue {
  tripId: string;
  trip: Trip;
  role: TripRole | null;
  canEdit: boolean;
  canManage: boolean;
  loading: boolean;
  accessDenied: boolean;
  toolbarMsg: string;
  editDayId: string | null;
  editActKey: string | null;
  editHeroOpen: boolean;
  editRouteOpen: boolean;
  editTipsOpen: boolean;
  shareOpen: boolean;
  setEditDayId: (id: string | null) => void;
  setEditActKey: (key: string | null) => void;
  setEditHeroOpen: (open: boolean) => void;
  setEditRouteOpen: (open: boolean) => void;
  setEditTipsOpen: (open: boolean) => void;
  setShareOpen: (open: boolean) => void;
  showMsg: (msg: string) => void;
  exportData: () => void;
  importFromFile: (file: File) => void;
  clearAllDays: () => void;
  saveMeta: (updates: Partial<TripMeta>) => void;
  saveTips: (tips: Tip[], tipsSectionTitle?: string) => void;
  syncRoutePointsFromDays: () => void;
  saveRoutePoints: (
    routePoints: { dayId: string; routePoint: string }[],
    routeEndLabel: string,
  ) => void;
  addDay: () => string;
  removeDay: (dayId: string) => void;
  saveDay: (dayId: string, updates: Partial<Day>) => void;
  addActivity: (dayId: string, insertAt?: number) => string;
  saveActivity: (dayId: string, actId: string, updates: Partial<Activity>) => void;
  deleteActivity: (dayId: string, actId: string) => void;
  reorderActivities: (
    dayId: string,
    fromId: string,
    toId: string,
    before: boolean,
  ) => void;
  reorderDays: (fromId: string, toId: string, before: boolean) => void;
}

const TripContext = createContext<TripContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 500;
const EMPTY_TRIP_FALLBACK = normalizeTrip({});

export function TripProvider({
  tripId,
  children,
}: {
  tripId: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [role, setRole] = useState<TripRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [toolbarMsg, setToolbarMsg] = useState(DEFAULT_TOOLBAR_LABEL);
  const [editDayId, setEditDayId] = useState<string | null>(null);
  const [editActKey, setEditActKey] = useState<string | null>(null);
  const [editHeroOpen, setEditHeroOpenState] = useState(false);
  const [editRouteOpen, setEditRouteOpenState] = useState(false);
  const [editTipsOpen, setEditTipsOpenState] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTrip = useRef<Trip | null>(null);

  const canEdit = role === 'owner' || role === 'editor';
  const canManage = role === 'owner';

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setAccessDenied(false);

    const unsubTrip = onSnapshot(
      doc(db, 'trips', tripId),
      (snap) => {
        if (!snap.exists()) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        setTrip(normalizeTrip(snap.data()));
        setLoading(false);
      },
      () => {
        setAccessDenied(true);
        setLoading(false);
      },
    );

    const unsubMember = onSnapshot(
      doc(db, 'trips', tripId, 'members', user.uid),
      (snap) => {
        if (!snap.exists()) {
          setRole(null);
          setAccessDenied(true);
          return;
        }
        setRole(snap.data().role as TripRole);
        setAccessDenied(false);
      },
      () => {
        setRole(null);
        setAccessDenied(true);
      },
    );

    return () => {
      unsubTrip();
      unsubMember();
    };
  }, [tripId, user]);

  const persistToFirestore = useCallback(
    async (next: Trip) => {
      if (!user || !canEdit) return;
      const tripRef = doc(db, 'trips', tripId);
      await updateDoc(tripRef, {
        title: next.title,
        meta: next.meta,
        tips: next.tips,
        days: next.days,
        updatedAt: serverTimestamp(),
      });
      const membershipRef = doc(db, 'users', user.uid, 'memberships', tripId);
      await updateDoc(membershipRef, {
        title: next.title,
        updatedAt: serverTimestamp(),
      });
    },
    [tripId, user, canEdit],
  );

  const commit = useCallback(
    (next: Trip) => {
      const normalized = normalizeTrip(next);
      setTrip(normalized);
      pendingTrip.current = normalized;

      if (!canEdit) return;

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const toSave = pendingTrip.current;
        if (toSave) void persistToFirestore(toSave);
      }, SAVE_DEBOUNCE_MS);
    },
    [canEdit, persistToFirestore],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const closePageEdits = useCallback(() => {
    setEditHeroOpenState(false);
    setEditRouteOpenState(false);
    setEditTipsOpenState(false);
  }, []);

  const setEditHeroOpen = useCallback(
    (open: boolean) => {
      if (!canEdit) return;
      if (open) {
        closePageEdits();
        setEditHeroOpenState(true);
      } else {
        setEditHeroOpenState(false);
      }
    },
    [canEdit, closePageEdits],
  );

  const setEditRouteOpen = useCallback(
    (open: boolean) => {
      if (!canEdit) return;
      if (open) {
        closePageEdits();
        setEditRouteOpenState(true);
      } else {
        setEditRouteOpenState(false);
      }
    },
    [canEdit, closePageEdits],
  );

  const setEditTipsOpen = useCallback(
    (open: boolean) => {
      if (!canEdit) return;
      if (open) {
        closePageEdits();
        setEditTipsOpenState(true);
      } else {
        setEditTipsOpenState(false);
      }
    },
    [canEdit, closePageEdits],
  );

  const showMsg = useCallback((msg: string) => {
    setToolbarMsg(msg);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => {
      setToolbarMsg(DEFAULT_TOOLBAR_LABEL);
    }, 2000);
  }, []);

  const exportData = useCallback(() => {
    if (!trip) return;
    const blob = new Blob([JSON.stringify(trip, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${trip.title || 'trip'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [trip]);

  const importFromFile = useCallback(
    (file: File) => {
      if (!canEdit || !trip) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = normalizeTrip(JSON.parse(ev.target?.result as string));
          commit(parsed);
          closePageEdits();
          setEditDayId(null);
          setEditActKey(null);
          showMsg('✓ יובא בהצלחה');
        } catch {
          alert('קובץ לא תקין');
        }
      };
      reader.readAsText(file);
    },
    [canEdit, trip, commit, showMsg, closePageEdits],
  );

  const clearAllDays = useCallback(() => {
    if (!canEdit || !trip) return;
    if (!confirm('למחוק את כל הימים?')) return;
    commit({ ...trip, days: [] });
    setEditDayId(null);
    setEditActKey(null);
    closePageEdits();
    showMsg('✓ נמחקו כל הימים');
  }, [canEdit, trip, commit, showMsg, closePageEdits]);

  const saveMeta = useCallback(
    (updates: Partial<TripMeta>) => {
      if (!trip) return;
      commit({
        ...trip,
        meta: { ...trip.meta, ...updates },
      });
      setEditHeroOpenState(false);
      showMsg('✓ נשמר');
    },
    [trip, commit, showMsg],
  );

  const saveTips = useCallback(
    (tips: Tip[], tipsSectionTitle?: string) => {
      if (!trip) return;
      commit({
        ...trip,
        tips,
        meta: {
          ...trip.meta,
          ...(tipsSectionTitle !== undefined ? { tipsSectionTitle } : {}),
        },
      });
      setEditTipsOpenState(false);
      showMsg('✓ נשמר');
    },
    [trip, commit, showMsg],
  );

  const syncRoutePointsFromDays = useCallback(() => {
    if (!trip) return;
    commit({
      ...trip,
      days: trip.days.map((d) => ({
        ...d,
        routePoint: routePointFromRoute(d.route),
      })),
    });
    showMsg('✓ סונכרן');
  }, [trip, commit, showMsg]);

  const saveRoutePoints = useCallback(
    (
      routePoints: { dayId: string; routePoint: string }[],
      routeEndLabel: string,
    ) => {
      if (!trip) return;
      const pointMap = new Map(routePoints.map((p) => [p.dayId, p.routePoint]));
      commit({
        ...trip,
        meta: { ...trip.meta, routeEndLabel },
        days: trip.days.map((d) => ({
          ...d,
          routePoint: pointMap.get(d.id) ?? d.routePoint,
        })),
      });
      setEditRouteOpenState(false);
      showMsg('✓ נשמר');
    },
    [trip, commit, showMsg],
  );

  const addDay = useCallback(() => {
    if (!canEdit || !trip) return '';
    const id = 'd' + Date.now();
    const route = 'מסלול יום חדש';
    const next: Trip = {
      ...trip,
      days: [
        ...trip.days,
        {
          id,
          dayName: 'יום ' + (trip.days.length + 1),
          date: '',
          route,
          routePoint: routePointFromRoute(route),
          km: '~0',
          hotel: '',
          hotelUrl: '',
          navUrl: '',
          activities: [
            {
              id: 'a' + Date.now(),
              icon: '📌',
              time: '',
              title: 'פעילות ראשונה',
              desc: '',
              mapUrl: '',
            },
          ],
        },
      ],
    };
    commit(next);
    setEditDayId(id);
    return id;
  }, [canEdit, trip, commit]);

  const removeDay = useCallback(
    (dayId: string) => {
      if (!canEdit || !trip) return;
      if (!confirm('למחוק את היום הזה?')) return;
      commit({ ...trip, days: trip.days.filter((d) => d.id !== dayId) });
      if (editDayId === dayId) setEditDayId(null);
    },
    [canEdit, trip, commit, editDayId],
  );

  const saveDay = useCallback(
    (dayId: string, updates: Partial<Day>) => {
      if (!trip) return;
      commit({
        ...trip,
        days: trip.days.map((d) =>
          d.id === dayId ? { ...d, ...updates } : d,
        ),
      });
      setEditDayId(null);
      showMsg('✓ נשמר');
    },
    [trip, commit, showMsg],
  );

  const addActivity = useCallback(
    (dayId: string, insertAt?: number) => {
      if (!canEdit || !trip) return '';
      const actId = 'a' + Date.now();
      const newActivity = {
        id: actId,
        icon: '📌',
        time: '',
        title: 'פעילות חדשה',
        desc: '',
        mapUrl: '',
      };
      const next: Trip = {
        ...trip,
        days: trip.days.map((d) => {
          if (d.id !== dayId) return d;
          const at = insertAt ?? d.activities.length;
          return {
            ...d,
            activities: [
              ...d.activities.slice(0, at),
              newActivity,
              ...d.activities.slice(at),
            ],
          };
        }),
      };
      commit(next);
      setEditActKey(`${dayId}:${actId}`);
      return actId;
    },
    [canEdit, trip, commit],
  );

  const saveActivity = useCallback(
    (dayId: string, actId: string, updates: Partial<Activity>) => {
      if (!trip) return;
      commit({
        ...trip,
        days: trip.days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                activities: d.activities.map((a) =>
                  a.id === actId ? { ...a, ...updates } : a,
                ),
              }
            : d,
        ),
      });
      setEditActKey(null);
      showMsg('✓ נשמר');
    },
    [trip, commit, showMsg],
  );

  const deleteActivity = useCallback(
    (dayId: string, actId: string) => {
      if (!canEdit || !trip) return;
      if (!confirm('למחוק פעילות זו?')) return;
      commit({
        ...trip,
        days: trip.days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                activities: d.activities.filter((a) => a.id !== actId),
              }
            : d,
        ),
      });
      if (editActKey === `${dayId}:${actId}`) setEditActKey(null);
    },
    [canEdit, trip, commit, editActKey],
  );

  const reorderActivities = useCallback(
    (dayId: string, fromId: string, toId: string, before: boolean) => {
      if (!canEdit || !trip) return;
      commit({
        ...trip,
        days: trip.days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                activities: reorderList(d.activities, fromId, toId, before),
              }
            : d,
        ),
      });
    },
    [canEdit, trip, commit],
  );

  const reorderDays = useCallback(
    (fromId: string, toId: string, before: boolean) => {
      if (!canEdit || !trip) return;
      commit({ ...trip, days: reorderList(trip.days, fromId, toId, before) });
    },
    [canEdit, trip, commit],
  );

  useEffect(() => {
    if (trip) {
      setToolbarMsg(trip.title || trip.meta.heroTitle || DEFAULT_TOOLBAR_LABEL);
    }
  }, [trip?.title, trip?.meta.heroTitle]);

  const value = useMemo(
    () => ({
      tripId,
      trip: trip ?? EMPTY_TRIP_FALLBACK,
      role,
      canEdit,
      canManage,
      loading,
      accessDenied,
      toolbarMsg,
      editDayId,
      editActKey,
      editHeroOpen,
      editRouteOpen,
      editTipsOpen,
      shareOpen,
      setEditDayId,
      setEditActKey,
      setEditHeroOpen,
      setEditRouteOpen,
      setEditTipsOpen,
      setShareOpen,
      showMsg,
      exportData,
      importFromFile,
      clearAllDays,
      saveMeta,
      saveTips,
      syncRoutePointsFromDays,
      saveRoutePoints,
      addDay,
      removeDay,
      saveDay,
      addActivity,
      saveActivity,
      deleteActivity,
      reorderActivities,
      reorderDays,
    }),
    [
      tripId,
      trip,
      role,
      canEdit,
      canManage,
      loading,
      accessDenied,
      toolbarMsg,
      editDayId,
      editActKey,
      editHeroOpen,
      editRouteOpen,
      editTipsOpen,
      shareOpen,
      setEditHeroOpen,
      setEditRouteOpen,
      setEditTipsOpen,
      showMsg,
      exportData,
      importFromFile,
      clearAllDays,
      saveMeta,
      saveTips,
      syncRoutePointsFromDays,
      saveRoutePoints,
      addDay,
      removeDay,
      saveDay,
      addActivity,
      saveActivity,
      deleteActivity,
      reorderActivities,
      reorderDays,
    ],
  );

  if (loading) {
    return (
      <div className="auth-loading">
        <p>טוען טיול...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>אין גישה</h1>
          <p>אין לך הרשאה לצפות בטיול הזה.</p>
          <a href="/" className="auth-link">
            חזרה לרשימת הטיולים
          </a>
        </div>
      </div>
    );
  }

  return (
    <TripContext.Provider value={value}>{children}</TripContext.Provider>
  );
}

export function useTripContext(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTripContext must be used within TripProvider');
  return ctx;
}
