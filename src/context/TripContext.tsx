import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_TOOLBAR_LABEL, STORAGE_KEY } from '../constants';
import { DEFAULT_TRIP } from '../data/defaultTrip';
import type { Activity, Day, Tip, Trip, TripMeta } from '../types/trip';
import { normalizeTrip, routePointFromRoute } from '../utils/normalizeTrip';

function loadTrip(): Trip {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeTrip(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return structuredClone(DEFAULT_TRIP);
}

function persistTrip(trip: Trip) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
}

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
  trip: Trip;
  toolbarMsg: string;
  editDayId: string | null;
  editActKey: string | null;
  editHeroOpen: boolean;
  editRouteOpen: boolean;
  editTipsOpen: boolean;
  setEditDayId: (id: string | null) => void;
  setEditActKey: (key: string | null) => void;
  setEditHeroOpen: (open: boolean) => void;
  setEditRouteOpen: (open: boolean) => void;
  setEditTipsOpen: (open: boolean) => void;
  showMsg: (msg: string) => void;
  exportData: () => void;
  importFromFile: (file: File) => void;
  resetAll: () => void;
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
  addActivity: (dayId: string) => string;
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

export function TripProvider({ children }: { children: ReactNode }) {
  const [trip, setTrip] = useState<Trip>(loadTrip);
  const [toolbarMsg, setToolbarMsg] = useState(DEFAULT_TOOLBAR_LABEL);
  const [editDayId, setEditDayId] = useState<string | null>(null);
  const [editActKey, setEditActKey] = useState<string | null>(null);
  const [editHeroOpen, setEditHeroOpenState] = useState(false);
  const [editRouteOpen, setEditRouteOpenState] = useState(false);
  const [editTipsOpen, setEditTipsOpenState] = useState(false);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closePageEdits = useCallback(() => {
    setEditHeroOpenState(false);
    setEditRouteOpenState(false);
    setEditTipsOpenState(false);
  }, []);

  const setEditHeroOpen = useCallback(
    (open: boolean) => {
      if (open) {
        closePageEdits();
        setEditHeroOpenState(true);
      } else {
        setEditHeroOpenState(false);
      }
    },
    [closePageEdits],
  );

  const setEditRouteOpen = useCallback(
    (open: boolean) => {
      if (open) {
        closePageEdits();
        setEditRouteOpenState(true);
      } else {
        setEditRouteOpenState(false);
      }
    },
    [closePageEdits],
  );

  const setEditTipsOpen = useCallback(
    (open: boolean) => {
      if (open) {
        closePageEdits();
        setEditTipsOpenState(true);
      } else {
        setEditTipsOpenState(false);
      }
    },
    [closePageEdits],
  );

  const commit = useCallback((next: Trip) => {
    const normalized = normalizeTrip(next);
    setTrip(normalized);
    persistTrip(normalized);
  }, []);

  const showMsg = useCallback((msg: string) => {
    setToolbarMsg(msg);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => {
      setToolbarMsg(DEFAULT_TOOLBAR_LABEL);
    }, 2000);
  }, []);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(trip, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'germany-trip.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [trip]);

  const importFromFile = useCallback(
    (file: File) => {
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
    [commit, showMsg, closePageEdits],
  );

  const resetAll = useCallback(() => {
    if (!confirm('לאפס לתכנון המקורי?')) return;
    localStorage.removeItem(STORAGE_KEY);
    const next = structuredClone(DEFAULT_TRIP);
    commit(next);
    setEditDayId(null);
    setEditActKey(null);
    closePageEdits();
    showMsg('↩ אופס');
  }, [commit, showMsg, closePageEdits]);

  const saveMeta = useCallback(
    (updates: Partial<TripMeta>) => {
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
      commit({
        ...trip,
        tips,
        meta: {
          ...trip.meta,
          ...(tipsSectionTitle !== undefined
            ? { tipsSectionTitle }
            : {}),
        },
      });
      setEditTipsOpenState(false);
      showMsg('✓ נשמר');
    },
    [trip, commit, showMsg],
  );

  const syncRoutePointsFromDays = useCallback(() => {
      commit({
        ...trip,
        days: trip.days.map((d) => ({
          ...d,
          routePoint: routePointFromRoute(d.route),
        })),
      });
      showMsg('✓ סונכרן');
    },
    [trip, commit, showMsg],
  );

  const saveRoutePoints = useCallback(
    (
      routePoints: { dayId: string; routePoint: string }[],
      routeEndLabel: string,
    ) => {
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
  }, [trip, commit]);

  const removeDay = useCallback(
    (dayId: string) => {
      if (!confirm('למחוק את היום הזה?')) return;
      commit({ ...trip, days: trip.days.filter((d) => d.id !== dayId) });
      if (editDayId === dayId) setEditDayId(null);
    },
    [trip, commit, editDayId],
  );

  const saveDay = useCallback(
    (dayId: string, updates: Partial<Day>) => {
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
    (dayId: string) => {
      const actId = 'a' + Date.now();
      const next: Trip = {
        ...trip,
        days: trip.days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                activities: [
                  ...d.activities,
                  {
                    id: actId,
                    icon: '📌',
                    time: '',
                    title: 'פעילות חדשה',
                    desc: '',
                    mapUrl: '',
                  },
                ],
              }
            : d,
        ),
      };
      commit(next);
      setEditActKey(`${dayId}:${actId}`);
      return actId;
    },
    [trip, commit],
  );

  const saveActivity = useCallback(
    (dayId: string, actId: string, updates: Partial<Activity>) => {
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
    [trip, commit, editActKey],
  );

  const reorderActivities = useCallback(
    (dayId: string, fromId: string, toId: string, before: boolean) => {
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
    [trip, commit],
  );

  const reorderDays = useCallback(
    (fromId: string, toId: string, before: boolean) => {
      commit({ ...trip, days: reorderList(trip.days, fromId, toId, before) });
    },
    [trip, commit],
  );

  const value = useMemo(
    () => ({
      trip,
      toolbarMsg,
      editDayId,
      editActKey,
      editHeroOpen,
      editRouteOpen,
      editTipsOpen,
      setEditDayId,
      setEditActKey,
      setEditHeroOpen,
      setEditRouteOpen,
      setEditTipsOpen,
      showMsg,
      exportData,
      importFromFile,
      resetAll,
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
      trip,
      toolbarMsg,
      editDayId,
      editActKey,
      editHeroOpen,
      editRouteOpen,
      editTipsOpen,
      setEditHeroOpen,
      setEditRouteOpen,
      setEditTipsOpen,
      showMsg,
      exportData,
      importFromFile,
      resetAll,
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

  return (
    <TripContext.Provider value={value}>{children}</TripContext.Provider>
  );
}

export function useTripContext(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTripContext must be used within TripProvider');
  return ctx;
}
