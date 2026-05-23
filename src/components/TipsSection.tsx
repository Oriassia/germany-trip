import { useTripContext } from '../context/TripContext';
import { TipsEditPanel } from './TipsEditPanel';

export function TipsSection() {
  const { trip, canEdit, editTipsOpen, setEditTipsOpen, saveTips } = useTripContext();

  return (
    <div className="tip-card">
      <div className="tip-card-header">
        <h3>{trip.meta.tipsSectionTitle}</h3>
        {canEdit && (
          <button
            type="button"
            className={`section-edit-btn tips-edit-btn${editTipsOpen ? ' open' : ''}`}
            onClick={() => setEditTipsOpen(!editTipsOpen)}
          >
            ✏️ ערוך
          </button>
        )}
      </div>
      {trip.tips.map((tip) => (
        <div className="tip-row" key={tip.id}>
          <div className="tip-icon">{tip.icon}</div>
          <div className="tip-text">{tip.text}</div>
        </div>
      ))}
      <TipsEditPanel
        tips={trip.tips}
        tipsSectionTitle={trip.meta.tipsSectionTitle}
        open={editTipsOpen}
        onSave={(tips, tipsSectionTitle) => saveTips(tips, tipsSectionTitle)}
        onCancel={() => setEditTipsOpen(false)}
      />
    </div>
  );
}
