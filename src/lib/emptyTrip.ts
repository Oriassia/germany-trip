import type { Trip } from '../types/trip';

export const EMPTY_TRIP_PAYLOAD: Trip = {
  title: 'טיול חדש',
  meta: {
    heroTitle: '',
    heroSubtitle: '',
    routeEndLabel: '',
    tipsSectionTitle: 'טיפים',
  },
  tips: [],
  days: [],
};
