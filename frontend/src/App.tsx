import { lazy, Suspense } from 'react';

import MonitorPage from './pages/MonitorPage';

// Admin area is maintenance-only and never reached on the kiosk monitor, so
// split it out of the main bundle and load it on demand.
const AdminPage = lazy(() => import('./pages/AdminPage'));

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function getRoute(): 'admin' | 'monitor' {
  const pathname = window.location.pathname;
  const relativePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || '/'
    : pathname;

  return relativePath === '/admin' ? 'admin' : 'monitor';
}

export default function App() {
  return (
    <Suspense fallback={null}>
      {getRoute() === 'admin' ? <AdminPage /> : <MonitorPage />}
    </Suspense>
  );
}
