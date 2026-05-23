import { useTripContext } from '../context/TripContext';
import { RouteEditPanel } from './RouteEditPanel';

export function RouteBar() {
  const {
    trip,
    canEdit,
    editRouteOpen,
    setEditRouteOpen,
    saveRoutePoints,
    syncRoutePointsFromDays,
  } = useTripContext();

  const cities = [
    ...trip.days.map((d) => d.routePoint),
    trip.meta.routeEndLabel,
  ].filter(Boolean);

  return (
    <div className="route-bar-wrap">
      <div className="route-bar" id="route-bar">
        <div className="route-bar-inner">
          {cities.flatMap((city, i) => [
            <span key={`c-${i}`} className="route-stop">
              {city}
            </span>,
            ...(i < cities.length - 1
              ? [<span key={`a-${i}`} className="route-arrow" aria-hidden>←</span>]
              : []),
          ])}
        </div>
        {canEdit && (
          <button
            type="button"
            className={`section-edit-btn route-edit-btn${editRouteOpen ? ' open' : ''}`}
            onClick={() => setEditRouteOpen(!editRouteOpen)}
          >
            ✏️
          </button>
        )}
      </div>
      <RouteEditPanel
        days={trip.days}
        routeEndLabel={trip.meta.routeEndLabel}
        open={editRouteOpen}
        onSave={saveRoutePoints}
        onSync={syncRoutePointsFromDays}
        onCancel={() => setEditRouteOpen(false)}
      />
    </div>
  );
}
