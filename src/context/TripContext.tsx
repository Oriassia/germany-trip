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
import type { Activity, Day, Trip } from '../types/trip';

function loadTrip(): Trip {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Trip;
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
  setEditDayId: (id: string | null) => void;
  setEditActKey: (key: string | null) => void;
  showMsg: (msg: string) => void;
  exportData: () => void;
  importFromFile: (file: File) => void;
  resetAll: () => void;
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
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback((next: Trip) => {
    setTrip(next);
    persistTrip(next);
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
          const parsed = JSON.parse(ev.target?.result as string) as Trip;
          commit(parsed);
          showMsg('✓ יובא בהצלחה');
        } catch {
          alert('קובץ לא תקין');
        }
      };
      reader.readAsText(file);
    },
    [commit, showMsg],
  );

  const resetAll = useCallback(() => {
    if (!confirm('לאפס לתכנון המקורי?')) return;
    localStorage.removeItem(STORAGE_KEY);
    const next = structuredClone(DEFAULT_TRIP);
    commit(next);
    setEditDayId(null);
    setEditActKey(null);
    showMsg('↩ אופס');
  }, [commit, showMsg]);

  const addDay = useCallback(() => {
    const id = 'd' + Date.now();
    const next: Trip = {
      days: [
        ...trip.days,
        {
          id,
          dayName: 'יום ' + (trip.days.length + 1),
          date: '',
          route: 'מסלול יום חדש',
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
  }, [trip.days, commit]);

  const removeDay = useCallback(
    (dayId: string) => {
      if (!confirm('למחוק את היום הזה?')) return;
      commit({ days: trip.days.filter((d) => d.id !== dayId) });
      if (editDayId === dayId) setEditDayId(null);
    },
    [trip.days, commit, editDayId],
  );

  const saveDay = useCallback(
    (dayId: string, updates: Partial<Day>) => {
      commit({
        days: trip.days.map((d) =>
          d.id === dayId ? { ...d, ...updates } : d,
        ),
      });
      setEditDayId(null);
      showMsg('✓ נשמר');
    },
    [trip.days, commit, showMsg],
  );

  const addActivity = useCallback(
    (dayId: string) => {
      const actId = 'a' + Date.now();
      const next: Trip = {
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
    [trip.days, commit],
  );

  const saveActivity = useCallback(
    (dayId: string, actId: string, updates: Partial<Activity>) => {
      commit({
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
    [trip.days, commit, showMsg],
  );

  const deleteActivity = useCallback(
    (dayId: string, actId: string) => {
      if (!confirm('למחוק פעילות זו?')) return;
      commit({
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
    [trip.days, commit, editActKey],
  );

  const reorderActivities = useCallback(
    (dayId: string, fromId: string, toId: string, before: boolean) => {
      const next: Trip = {
        days: trip.days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                activities: reorderList(d.activities, fromId, toId, before),
              }
            : d,
        ),
      };
      commit(next);
    },
    [trip.days, commit],
  );

  const reorderDays = useCallback(
    (fromId: string, toId: string, before: boolean) => {
      commit({ days: reorderList(trip.days, fromId, toId, before) });
    },
    [trip.days, commit],
  );

  const value = useMemo(
    () => ({
      trip,
      toolbarMsg,
      editDayId,
      editActKey,
      setEditDayId,
      setEditActKey,
      showMsg,
      exportData,
      importFromFile,
      resetAll,
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
      showMsg,
      exportData,
      importFromFile,
      resetAll,
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
