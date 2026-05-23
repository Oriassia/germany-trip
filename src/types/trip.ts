import type { Timestamp } from 'firebase/firestore';

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
  title: string;
  meta: TripMeta;
  tips: Tip[];
  days: Day[];
}

export type TripRole = 'owner' | 'editor' | 'viewer';
export type InviteRole = 'editor' | 'viewer';
export type InviteStatus = 'pending' | 'accepted' | 'revoked';

export interface TripMembership {
  tripId: string;
  role: TripRole;
  title: string;
  updatedAt: Timestamp;
}

export interface TripMember {
  role: TripRole;
  email: string;
  displayName?: string;
  addedAt: Timestamp;
  addedBy: string;
}

export interface TripInvite {
  email: string;
  role: InviteRole;
  title?: string;
  status: InviteStatus;
  createdAt: Timestamp;
  createdBy: string;
}
