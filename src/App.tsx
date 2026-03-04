import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import Analytics from './pages/Analytics';
import SerialMonitor from './pages/SerialMonitor';
import HardwareStatus from './pages/HardwareStatus';
import Documentation from './pages/Documentation';

export default function App() {
  return (
    <div className="flex flex-col w-full min-h-screen h-full">
      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/map" element={<LiveMap />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/serial" element={<SerialMonitor />} />
              <Route path="/hardware" element={<HardwareStatus />} />
              <Route path="/docs" element={<Documentation />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </div>
  );
}
