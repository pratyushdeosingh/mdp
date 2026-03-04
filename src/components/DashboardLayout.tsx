import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [collapsed, setCollapsed] = useState(false);

  if (isLanding) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto transition-all duration-300 flex flex-col"
        style={{ marginLeft: collapsed ? '4rem' : '15rem' }}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
