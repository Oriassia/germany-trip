import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DaysList } from '../components/DaysList';
import { EditToolbar } from '../components/EditToolbar';
import { Hero } from '../components/Hero';
import { MapSection } from '../components/MapSection';
import { QuickLinks } from '../components/QuickLinks';
import { RouteBar } from '../components/RouteBar';
import { SearchPanel } from '../components/SearchPanel';
import { SharePanel } from '../components/SharePanel';
import { SummaryStats } from '../components/SummaryStats';
import { TipsSection } from '../components/TipsSection';
import { TripProvider, useTripContext } from '../context/TripContext';
import { useDragReorder } from '../hooks/useDragReorder';

function TripPageContent() {
  const { canEdit, addDay, reorderActivities, reorderDays } = useTripContext();
  const [searchOpen, setSearchOpen] = useState(false);

  const onReorderActivities = useCallback(
    (dayId: string, fromId: string, toId: string, before: boolean) => {
      reorderActivities(dayId, fromId, toId, before);
    },
    [reorderActivities],
  );

  const onReorderDays = useCallback(
    (fromId: string, toId: string, before: boolean) => {
      reorderDays(fromId, toId, before);
    },
    [reorderDays],
  );

  useDragReorder({
    onReorderActivities,
    onReorderDays,
    enabled: canEdit,
  });

  return (
    <>
      <div className="trip-nav">
        <Link to="/" className="trip-nav__back">
          ← הטיולים שלי
        </Link>
      </div>
      <Hero />
      <RouteBar />
      <MapSection />

      <div className="container">
        <SummaryStats />
        <DaysList />
        {canEdit && (
          <button type="button" className="add-day-card" onClick={() => addDay()}>
            + הוסף יום
          </button>
        )}
        <TipsSection />
        <QuickLinks />
        <div className="footer-note">נסיעה טובה ומהנה! ✨</div>
      </div>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
      <EditToolbar onOpenSearch={() => setSearchOpen(true)} />
      <SharePanel />
    </>
  );
}

export function TripPage() {
  const { tripId } = useParams<{ tripId: string }>();

  if (!tripId) {
    return (
      <div className="auth-page">
        <p>טיול לא נמצא</p>
        <Link to="/">חזרה</Link>
      </div>
    );
  }

  return (
    <TripProvider tripId={tripId}>
      <TripPageContent />
    </TripProvider>
  );
}
