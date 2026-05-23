import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { TripPage } from './pages/TripPage';
import { TripsListPage } from './pages/TripsListPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LandingPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <TripsListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips/:tripId"
          element={
            <RequireAuth>
              <TripPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
