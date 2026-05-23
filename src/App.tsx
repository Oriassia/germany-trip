import { useCallback, useState } from 'react';
import { DaysList } from './components/DaysList';
import { EditToolbar } from './components/EditToolbar';
import { Hero } from './components/Hero';
import { MapSection } from './components/MapSection';
import { QuickLinks } from './components/QuickLinks';
import { RouteBar } from './components/RouteBar';
import { SearchPanel } from './components/SearchPanel';
import { SummaryStats } from './components/SummaryStats';
import { TipsSection } from './components/TipsSection';
import { TripProvider, useTripContext } from './context/TripContext';
import { useDragReorder } from './hooks/useDragReorder';

function AppContent() {
  const { addDay, reorderActivities, reorderDays } = useTripContext();
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

  useDragReorder({ onReorderActivities, onReorderDays });

  return (
    <>
      <Hero />
      <RouteBar />
      <MapSection />

      <div className="container">
        <SummaryStats />
        <DaysList />
        <button type="button" className="add-day-card" onClick={() => addDay()}>
          + הוסף יום
        </button>
        <TipsSection />
        <QuickLinks />
        <div className="footer-note">נסיעה טובה ומהנה! 🇩🇪✨</div>
      </div>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
      <EditToolbar onOpenSearch={() => setSearchOpen(true)} />
    </>
  );
}

export default function App() {
  return (
    <TripProvider>
      <AppContent />
    </TripProvider>
  );
}
