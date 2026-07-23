import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { seismicApi } from '../../api/seismicApi';

interface SettingRow {
  label: string;
  value: string;
  unit?: string;
}

function formatNumber(value: unknown, fallback = '--') {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : fallback;
}

function buildRows(data: any): SettingRow[] {
  const rows: SettingRow[] = [
    { label: 'Warning level', value: formatNumber(data?.warning), unit: 'PEIS' },
    { label: 'Alert level', value: formatNumber(data?.warrant), unit: 'PEIS' },
    { label: 'Before window', value: formatNumber(data?.before), unit: 'sec' },
    { label: 'After window', value: formatNumber(data?.after), unit: 'sec' },
  ];

  for (const [key, label] of [
    ['xthold', 'X threshold'],
    ['ythold', 'Y threshold'],
    ['zthold', 'Z threshold'],
  ] as const) {
    if (data?.[key] !== undefined && data?.[key] !== null) {
      rows.push({ label, value: formatNumber(data[key]), unit: 'g' });
    }
  }

  return rows;
}

export function ThresholdSettings() {
  const [rows, setRows] = useState<SettingRow[]>(() => buildRows(null));
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [lastLoaded, setLastLoaded] = useState<string | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await seismicApi.getSourceSettings();
      if (res.success && res.data) {
        setRows(buildRows(res.data));
        setLastLoaded(new Date().toLocaleTimeString());
      } else {
        setRows(buildRows(null));
        setMessage(res.message || 'MDC settings unavailable.');
      }
    } catch {
      setRows(buildRows(null));
      setMessage('MDC settings unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <Card style={{ borderTop: '3px solid var(--brand)' }}>
      <div
        className="px-4 py-3 flex items-center justify-between gap-2"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <Icon name="sliders-horizontal" size={16} style={{ color: 'var(--brand)' }} />
          <div className="flex flex-col leading-tight">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              MDC thresholds
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Read-only source settings
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={loadConfig}
          disabled={loading}
          title="Refresh MDC settings"
          className="rounded-lg p-1.5 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
        >
          <Icon name="refresh-cw" size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-lg px-3 py-2"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
              }}
            >
              <span className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                {row.label}
              </span>
              <span className="mt-1 flex items-baseline gap-1 font-mono text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {row.unit === 'PEIS' && row.value !== '--' ? 'PEIS' : null}
                <span>{row.value}</span>
                {row.unit && row.unit !== 'PEIS' && row.value !== '--' ? (
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {row.unit}
                  </span>
                ) : null}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span className="font-semibold uppercase tracking-wider">Source: MDC</span>
          <span className="font-mono">{lastLoaded ? `Refreshed ${lastLoaded}` : 'Not refreshed'}</span>
        </div>

        {message && (
          <p
            className="text-xs font-medium rounded-lg px-3 py-2 flex items-center gap-1.5"
            style={{ backgroundColor: 'rgba(193,96,92,0.12)', color: 'var(--status-error)' }}
          >
            <Icon name="alert-triangle" size={13} />
            {message}
          </p>
        )}
      </div>
    </Card>
  );
}
