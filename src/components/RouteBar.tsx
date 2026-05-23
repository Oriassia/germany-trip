import { useTripContext } from '../context/TripContext';

export function RouteBar() {
  const { trip } = useTripContext();
  const cities = trip.days.map((d) => d.route.split('→')[0].trim());
  cities.push('MUC ✈️');

  return (
    <div className="route-bar" id="route-bar">
      {cities.flatMap((city, i) => [
        <span key={`c-${i}`}>
          <div className="dot" />
          {city}
        </span>,
        ...(i < cities.length - 1
          ? [<span key={`a-${i}`} className="arrow">→</span>]
          : []),
      ])}
    </div>
  );
}
