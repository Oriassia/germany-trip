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
  km: string;
  hotel: string;
  hotelUrl: string;
  navUrl: string;
  activities: Activity[];
}

export interface Trip {
  days: Day[];
}
