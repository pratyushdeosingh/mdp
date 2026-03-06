import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import SerialMonitor from './pages/SerialMonitor';
import HardwareStatus from './pages/HardwareStatus';

// Lazy-load heavy pages (leaflet, recharts, jspdf-embedded iframe)
const LiveMap = lazy(() => import('./pages/LiveMap'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Documentation = lazy(() => import('./pages/Documentation'));
const AccidentHistory = lazy(() => import('./pages/AccidentHistory'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-sm text-[var(--text-muted)]">Loading...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex flex-col w-full min-h-screen h-full">
      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/map" element={<Suspense fallback={<PageLoader />}><LiveMap /></Suspense>} />
              <Route path="/analytics" element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
              <Route path="/serial" element={<SerialMonitor />} />
              <Route path="/accidents" element={<Suspense fallback={<PageLoader />}><AccidentHistory /></Suspense>} />
              <Route path="/hardware" element={<HardwareStatus />} />
              <Route path="/docs" element={<Suspense fallback={<PageLoader />}><Documentation /></Suspense>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </div>
  );
}
