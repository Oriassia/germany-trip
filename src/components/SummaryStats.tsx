import { useTripContext } from '../context/TripContext';

export function SummaryStats() {
  const { trip } = useTripContext();
  const km = trip.days.reduce((s, d) => s + (parseInt(d.km) || 0), 0);
  const nights = Math.max(0, trip.days.length - 1);

  return (
    <div className="summary-grid" id="summary-stats">
      <div className="stat-card">
        <div className="stat-val">{km}</div>
        <div className="stat-label">ק&quot;מ סה&quot;כ</div>
      </div>
      <div className="stat-card">
        <div className="stat-val">{trip.days.length}</div>
        <div className="stat-label">ימי טיול</div>
      </div>
      <div className="stat-card">
        <div className="stat-val">{nights}</div>
        <div className="stat-label">לילות</div>
      </div>
    </div>
  );
}
