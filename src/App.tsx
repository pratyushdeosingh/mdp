import { lazy, Suspense, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
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

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)] p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Something went wrong</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <div className="flex flex-col w-full min-h-screen h-full">
      <ErrorBoundary>
        <BrowserRouter>
        <AppProvider>
          <ToastProvider>
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
          </ToastProvider>
        </AppProvider>
      </BrowserRouter>
      </ErrorBoundary>
    </div>
  );
}
