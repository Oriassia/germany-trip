import { useTripContext } from '../context/TripContext';

export function QuickLinks() {
  const { trip } = useTripContext();
  const hotels = trip.days.filter((d) => d.hotelUrl);
  const navDays = trip.days.filter((d) => d.navUrl);

  return (
    <div className="tip-card" id="quick-links">
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14, color: '#26215C' }}>
        🔗 קישורים מהירים
      </h3>
      <div className="section-label">מקומות לינה</div>
      <div className="map-link-row" style={{ marginBottom: 12 }}>
        {hotels.length > 0 ? (
          hotels.map((d) => (
            <a
              key={d.id}
              className="map-tag"
              href={d.hotelUrl}
              target="_blank"
              rel="noreferrer"
            >
              🏨 {d.hotel}
            </a>
          ))
        ) : (
          <p className="quick-links-empty">
            אין קישורי לינה — הוסיפו Maps ללינה בעריכת יום (✏️ ערוך).
          </p>
        )}
      </div>
      <div className="section-label">ניווט יומי</div>
      <div className="map-link-row">
        {navDays.length > 0 ? (
          trip.days.map((d, i) =>
            d.navUrl ? (
              <a
                key={d.id}
                className="dir-btn"
                href={d.navUrl}
                target="_blank"
                rel="noreferrer"
              >
                יום {i + 1} – {d.route}
              </a>
            ) : null,
          )
        ) : (
          <p className="quick-links-empty">
            אין קישורי ניווט — הוסיפו קישור ניווט יומי בעריכת יום.
          </p>
        )}
      </div>
    </div>
  );
}
