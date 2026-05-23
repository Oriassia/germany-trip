import { EMPTY_TRIP_PAYLOAD } from '../lib/emptyTrip';
import type { Day, Tip, Trip, TripMeta } from '../types/trip';

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

const EMPTY_META: TripMeta = { ...EMPTY_TRIP_PAYLOAD.meta };

export function normalizeTrip(raw: unknown): Trip {
  const partial = (raw ?? {}) as Partial<Trip>;
  const days = (partial.days ?? []).map((d) => normalizeDay(d as Day));

  return {
    title: partial.title?.trim() || EMPTY_TRIP_PAYLOAD.title,
    meta: { ...EMPTY_META, ...partial.meta },
    tips: (partial.tips ?? []).map(normalizeTip),
    days,
  };
}
