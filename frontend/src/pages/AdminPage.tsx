import { useEffect } from 'react';
import usherMarker from '../assets/usher-marker.svg';
import { Icon } from '../components/ui/Icon';
import { ThresholdSettings } from '../components/admin/ThresholdSettings';
import { EventList } from '../components/admin/EventList';

/**
 * Tech-support dashboard: MDC diagnostics, admin password change, and the
 * event log.
 */
export default function AdminPage() {
  const monitorHref = import.meta.env.BASE_URL;

  useEffect(() => {
    const theme = (localStorage.getItem('usher-theme') as 'light' | 'dark') || 'light';
    document.documentElement.dataset.theme = theme;
  }, []);

  return (
    <div className="h-screen overflow-y-auto font-sans" style={{ backgroundColor: 'var(--bg-base)' }}>
      <header
        className="sticky top-0 z-10 px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-lg px-2 h-9 shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-gradient-end) 100%)' }}
          >
            <img src={usherMarker} alt="USHER" className="h-5 w-auto brightness-0 invert" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Tech support dashboard
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              MDC diagnostics &amp; event log
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={monitorHref}
            className="rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            <Icon name="monitor" size={14} /> Monitor
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
        <ThresholdSettings />
        <EventList />
      </main>
    </div>
  );
}
