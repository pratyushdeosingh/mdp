import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export default function DashboardLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useIsDesktop();

  // Close mobile sidebar on route change
  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (isLanding) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Mobile hamburger button — only on small screens */}
      {!isDesktop && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2.5 rounded-xl border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)' }}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Mobile overlay backdrop */}
      {mobileOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — always visible on desktop, overlay on mobile */}
      {(isDesktop || mobileOpen) && (
        <div className={`fixed top-0 left-0 h-screen z-40 ${!isDesktop ? 'sidebar-mobile-enter' : ''}`}>
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            onMobileClose={isDesktop ? undefined : () => setMobileOpen(false)}
          />
        </div>
      )}

      <main
        className="flex-1 overflow-y-auto transition-all duration-300 flex flex-col p-6 md:p-8 lg:p-10"
        style={{
          marginLeft: isDesktop ? (collapsed ? '4rem' : '15rem') : 0,
          paddingTop: isDesktop ? undefined : '3.5rem',
        }}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <div key={location.pathname} className="page-transition flex-1 flex flex-col">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
