export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
}

const ICONS: Record<string, string> = {
  hotel: '🏨',
  hostel: '🏨',
  guest_house: '🏠',
  restaurant: '🍽️',
  cafe: '☕',
  bar: '🍺',
  museum: '🏛️',
  airport: '✈️',
  park: '🌿',
  church: '⛪',
  castle: '🏰',
  shop: '🛍️',
  mall: '🛍️',
};

export function getResultIcon(item: NominatimResult): string {
  return ICONS[item.type ?? ''] || ICONS[item.class ?? ''] || '📍';
}

export function getMapsUrl(lat: string, lon: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

export async function nominatimSearch(query: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`;
  const res = await fetch(url);
  return res.json() as Promise<NominatimResult[]>;
}
