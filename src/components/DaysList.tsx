import { useTripContext } from '../context/TripContext';
import { DayCard } from './DayCard';

export function DaysList() {
  const { trip } = useTripContext();

  return (
    <div id="days-container">
      {trip.days.map((day, i) => (
        <DayCard key={day.id} day={day} dayNum={i + 1} />
      ))}
    </div>
  );
}
