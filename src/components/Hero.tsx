import { useTripContext } from '../context/TripContext';
import { HeroEditPanel } from './HeroEditPanel';

export function Hero() {
  const { trip, editHeroOpen, setEditHeroOpen, saveMeta } = useTripContext();

  return (
    <div className="hero">
      <div className="hero-header">
        <div className="hero-text">
          <h1>{trip.meta.heroTitle}</h1>
          <p>{trip.meta.heroSubtitle}</p>
        </div>
        <button
          type="button"
          className={`section-edit-btn hero-edit-btn${editHeroOpen ? ' open' : ''}`}
          onClick={() => setEditHeroOpen(!editHeroOpen)}
        >
          ✏️ ערוך
        </button>
      </div>
      <HeroEditPanel
        meta={trip.meta}
        open={editHeroOpen}
        onSave={saveMeta}
        onCancel={() => setEditHeroOpen(false)}
      />
    </div>
  );
}
