export interface Activity {
  id: string;
  icon: string;
  time: string;
  title: string;
  desc: string;
  mapUrl: string;
}

export interface Day {
  id: string;
  dayName: string;
  date: string;
  route: string;
  routePoint: string;
  km: string;
  hotel: string;
  hotelUrl: string;
  navUrl: string;
  activities: Activity[];
}

export interface TripMeta {
  heroTitle: string;
  heroSubtitle: string;
  routeEndLabel: string;
  tipsSectionTitle: string;
}

export interface Tip {
  id: string;
  icon: string;
  text: string;
}

export interface Trip {
  meta: TripMeta;
  tips: Tip[];
  days: Day[];
}
