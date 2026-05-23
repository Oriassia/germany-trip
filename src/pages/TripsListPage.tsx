import { useAuth } from '../context/AuthContext';
import { TripList } from '../components/TripList';
import { useUserTrips } from '../hooks/useUserTrips';

export function TripsListPage() {
  const { user, signOut } = useAuth();
  const { trips, loading, error } = useUserTrips(user?.uid);

  return (
    <div className="trips-page">
      <header className="trips-page__header">
        <h1>הטיולים שלי</h1>
        <div className="trips-page__user">
          {user?.displayName && <span>{user.displayName}</span>}
          <button type="button" className="trips-signout-btn" onClick={() => signOut()}>
            התנתק
          </button>
        </div>
      </header>
      {loading && <p className="trips-loading">טוען...</p>}
      {error && <p className="trips-error">{error}</p>}
      {!loading && !error && <TripList trips={trips} />}
    </div>
  );
}
