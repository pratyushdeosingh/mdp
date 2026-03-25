import { useState, useMemo, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Radio } from 'lucide-react';
import NavDrawer from './NavDrawer';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/sensors': 'Sensor Data',
  '/map': 'Live Map',
  '/logs': 'System Logs',
  '/hardware': 'Hardware Setup',
  '/analytics': 'Analytics',
  '/accidents': 'Incident Log',
  '/serial': 'Serial Monitor',
  '/settings': 'Settings',
};

export default function DashboardLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Memoize close handler
  const handleClose = useCallback(() => setDrawerOpen(false), []);

  const pageTitle = useMemo(() => {
    return PAGE_TITLES[location.pathname] ?? 'Smart Helmet';
  }, [location.pathname]);

  if (isLanding) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Top Header Bar */}
      <header
        className="sticky top-0 flex items-center gap-3 px-4 sm:px-6 py-3"
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          zIndex: 30,
        }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="hamburger-btn"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--status-blue-bg)' }}
          >
            <Radio size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <h1
              className="text-sm font-bold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Connection indicator */}
        <div className="flex items-center gap-1.5 shrink-0 select-none">
          <span className="w-2 h-2 rounded-full pulse-live" style={{ background: 'var(--color-emerald)' }} />
          <span className="hidden sm:inline text-[11px] font-medium" style={{ color: 'var(--color-emerald)' }}>
            Online
          </span>
        </div>
      </header>

      {/* Navigation Drawer - key forces remount on route change which closes it */}
      <NavDrawer key={location.pathname} open={drawerOpen} onClose={handleClose} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div key={location.pathname} className="page-transition w-full h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
