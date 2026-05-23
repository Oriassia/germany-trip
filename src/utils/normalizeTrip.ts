import type { Day, Tip, Trip, TripMeta } from '../types/trip';

export const DEFAULT_META: TripMeta = {
  heroTitle: '🇩🇪 טיול גרמניה – יוני 2026',
  heroSubtitle: 'פרנקפורט ← דרך הרומנטית ← רגנסבורג ← מינכן',
  routeEndLabel: 'MUC ✈️',
  tipsSectionTitle: '⚙️ טיפים טכניים לנסיעה',
};

export const DEFAULT_TIPS: Tip[] = [
  {
    id: 't1',
    icon: '🛣️',
    text: 'אוטובאן: שימו לב לשלטים. קטעים רבים מוגבלים ל-120–130 קמ"ש. מצלמות אוטומטיות נפוצות.',
  },
  {
    id: 't2',
    icon: '🅿️',
    text: 'חניה: רוטנבורג – Parkhaus Kobolzeller Steige. רגנסבורג – Parkhaus Dachauplatz. מינכן – חנייה מרכזית ברשמה מראש.',
  },
  {
    id: 't3',
    icon: '⛽',
    text: 'דלק: תחנות על האוטובאן יקרות ב-15–20%. עדיף לתדלק בתוך הערים.',
  },
  {
    id: 't4',
    icon: '🌡️',
    text: 'מזג אוויר יוני: 22–25°C ביום. ייתכנו גשמים קצרים. שכבה לערב בגינות הבירה.',
  },
  {
    id: 't5',
    icon: '💶',
    text: 'מטבע: אירו. קחו קצת מזומן לשווקים ומסעדות קטנות.',
  },
  {
    id: 't6',
    icon: '📱',
    text: 'ניווט: הורידו Google Maps offline לפני היציאה. כיסוי מצוין על A8 ו-A9.',
  },
];

export function routePointFromRoute(route: string): string {
  const parts = route.split('→');
  if (parts.length > 1) return parts[0].trim();
  return route.trim();
}

function normalizeDay(day: Day): Day {
  return {
    ...day,
    routePoint: day.routePoint?.trim() || routePointFromRoute(day.route),
  };
}

function normalizeTip(tip: Tip, index: number): Tip {
  return {
    id: tip.id || `t${index + 1}`,
    icon: tip.icon ?? '',
    text: tip.text ?? '',
  };
}

export function normalizeTrip(raw: unknown): Trip {
  const partial = (raw ?? {}) as Partial<Trip>;
  const days = (partial.days ?? []).map((d) => normalizeDay(d as Day));

  return {
    meta: { ...DEFAULT_META, ...partial.meta },
    tips: (partial.tips?.length ? partial.tips : DEFAULT_TIPS).map(normalizeTip),
    days,
  };
}
