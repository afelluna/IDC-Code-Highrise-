import { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/ui/Icon';

// Components
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { SummaryCard } from '../components/cards/SummaryCard';
import { ThresholdCard } from '../components/cards/ThresholdCard';
import { IntensityDisplay } from '../components/cards/IntensityDisplay';
import { IntensityLegend } from '../components/cards/IntensityLegend';
import { StatusCard } from '../components/cards/StatusCard';

// Hooks
import { useSeismicData } from '../hooks/useSeismicData';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSeismicMetrics } from '../hooks/useSeismicMetrics';
import { seismicApi } from '../api/seismicApi';
import type { SensorSample } from '../api/types';
import type { SeismogramHandle } from '../components/cards/Seismogram';

type SeismogramComponentType = typeof import('../components/cards/Seismogram')['Seismogram'];
type IdleWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function manilaTime(): string {
  return new Date().toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function SeismogramFallback() {
  return (
    <Card className="p-2 flex-1 min-h-0 flex flex-col gap-1">
      <Skeleton className="h-6 w-full shrink-0" />
      <Skeleton className="flex-1 w-full" />
      <div className="flex justify-center gap-6 shrink-0">
        <Skeleton className="h-4 w-18" />
        <Skeleton className="h-4 w-18" />
        <Skeleton className="h-4 w-18" />
      </div>
    </Card>
  );
}

export default function MonitorPage() {
  // Theme state. Kiosk display defaults to dark (SCADA/control-room look) but
  // the operator can flip it via the header toggle; the choice persists across
  // reloads.
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('usher-theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('usher-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Accelerograph ref for direct-push (bypasses React render cycle).
  const accelRef = useRef<SeismogramHandle>(null);
  const pendingChartBatchesRef = useRef<SensorSample[][]>([]);
  const [SeismogramComponent, setSeismogramComponent] = useState<SeismogramComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    const idleWindow = window as IdleWindow;

    const loadSeismogram = () => {
      void import('../components/cards/Seismogram').then((mod) => {
        if (!cancelled) {
          setSeismogramComponent(() => mod.Seismogram);
        }
      });
    };

    if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(loadSeismogram, { timeout: 1500 });
      return () => {
        cancelled = true;
        idleWindow.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(loadSeismogram, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!SeismogramComponent || !accelRef.current || pendingChartBatchesRef.current.length === 0) return;

    const batches = pendingChartBatchesRef.current.splice(0);
    for (const batch of batches) {
      accelRef.current.pushBatch(batch);
    }
  }, [SeismogramComponent]);

  // Manila clock, rendered above IntensityDisplay, outside the card.
  const [clock, setClock] = useState(manilaTime());
  useEffect(() => {
    const id = setInterval(() => setClock(manilaTime()), 1000);
    return () => clearInterval(id);
  }, []);

  const {
    currentData,
    totalEvents,
    loading,
    error,
    refreshAll,
    setCurrentData,
  } = useSeismicData();

  const enqueueChartSamples = (samples: SensorSample[]) => {
    if (accelRef.current) {
      accelRef.current.pushBatch(samples);
      return;
    }

    pendingChartBatchesRef.current.push(samples);
    if (pendingChartBatchesRef.current.length > 8) {
      pendingChartBatchesRef.current.splice(0, pendingChartBatchesRef.current.length - 8);
    }
  };

  // WebSocket for real-time updates.
  const { connected, nodeName, serverIp, error: wsError } = useWebSocket(
    (event) => {
      if (event.type === 'seismic.update') {
        // Push raw samples directly to chart with a small pre-mount queue so
        // the shell can paint before the heavy chart bundle arrives.
        if (event.data.samples) {
          enqueueChartSamples(event.data.samples);
        }
        setCurrentData(event.data);
      }
      if (event.type === 'seismic.alert') {
        refreshAll();
      }
      if (event.type === 'thresholds.updated') {
        applyThresholds(event.data);
      }
    }
  );

  // Mock mode has no websocket event stream, so its batches arrive via
  // currentData.rawSamples instead. Guarded so this is a no-op in production.
  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCKS === 'true' && currentData?.rawSamples?.length) {
      enqueueChartSamples(currentData.rawSamples);
    }
  }, [currentData]);

  // Live derived metrics from rolling 60s buffer.
  const { peakAccel, dominantFreq, maxDisp } = useSeismicMetrics(currentData);

  // Signal-animation thresholds (from configured warning/alert levels).
  const [warningLevel, setWarningLevel] = useState(5);
  const [alertLevel, setAlertLevel] = useState(8);
  const DEFAULT_HOLD_MS = 22000;
  const [holdMs, setHoldMs] = useState(DEFAULT_HOLD_MS);

  const applyThresholds = (d: any) => {
    const warn = Number(d.warning);
    const alert = Number(d.warrant);
    const holdSeconds = Number(d.after ?? d.tafter);
    if (Number.isFinite(warn) && warn > 0) setWarningLevel(warn);
    if (Number.isFinite(alert) && alert > 0) setAlertLevel(Math.max(alert, warn || alert));
    if (Number.isFinite(holdSeconds) && holdSeconds > 0) setHoldMs(holdSeconds * 1000);
  };

  useEffect(() => {
    seismicApi.getSourceSettings()
      .then((res) => {
        if (res.success && res.data) applyThresholds(res.data);
      })
      .catch(() => { /* keep the 5/8 fallback */ });
  }, []);

  // Peak-hold display intensity.
  const [displayIntensity, setDisplayIntensity] = useState(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peakHeldRef = useRef(0);
  const liveIntRef = useRef(0);

  useEffect(() => {
    const raw = currentData?.intensity || 0;
    liveIntRef.current = raw;

    if (raw >= peakHeldRef.current) {
      peakHeldRef.current = raw;
      setDisplayIntensity(raw);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => {
        peakHeldRef.current = 0;
        setDisplayIntensity(liveIntRef.current);
      }, holdMs);
    }
  }, [currentData?.intensity, holdMs]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const noOfEvents = totalEvents;

  // Last-packet freshness tracking.
  const [lastPacketTime, setLastPacketTime] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  useEffect(() => {
    if (currentData) setLastPacketTime(Date.now());
  }, [currentData]);

  useEffect(() => {
    if (connected) {
      setLastPacketTime((prev) => prev ?? Date.now());
    }
  }, [connected]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastPacketTime !== null) {
        setSecondsAgo(Math.floor((Date.now() - lastPacketTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastPacketTime]);

  const freshnessLabel = secondsAgo === null
    ? '—'
    : secondsAgo < 2
      ? 'just now'
      : `${secondsAgo}s ago`;

  // Fault detection.
  const [everConnected, setEverConnected] = useState(false);
  useEffect(() => {
    if (connected) setEverConnected(true);
  }, [connected]);

  const STALE_WARN_SECS = 15;
  const STALE_CRIT_SECS = 60;
  const dataStale = connected && secondsAgo !== null && secondsAgo > STALE_WARN_SECS;

  const faults: Array<{ severity: 'critical' | 'warning'; message: string }> = [];
  if (!connected && wsError) {
    faults.push({ severity: 'critical', message: `Gateway unreachable — ${wsError}` });
  } else if (!connected && everConnected) {
    faults.push({ severity: 'critical', message: 'Gateway connection lost — reconnecting' });
  }
  if (dataStale) {
    faults.push({
      severity: secondsAgo > STALE_CRIT_SECS ? 'critical' : 'warning',
      message: `No sensor data for ${secondsAgo}s — check sensor node`,
    });
  }
  if (error) {
    faults.push({ severity: 'warning', message: `API error: ${error.message || 'request failed'}` });
  }

  const hasCritical = faults.some((f) => f.severity === 'critical');

  const statusData: Array<{
    label: string;
    value: string;
    dot: 'live' | 'scanning' | 'idle' | 'error';
  }> = [
    {
      label: 'Connection',
      value: connected ? 'Live' : everConnected || wsError ? 'Fault' : 'Offline',
      dot: connected ? 'live' : everConnected || wsError ? 'error' : 'idle',
    },
    {
      label: 'Node',
      value: nodeName || 'Scanning…',
      dot: nodeName ? 'live' : 'scanning',
    },
    {
      label: 'Server',
      value: serverIp || 'Connecting…',
      dot: (error || wsError) ? 'error' : serverIp ? 'live' : 'scanning',
    },
    {
      label: 'Last update',
      value: loading ? 'Loading…' : freshnessLabel,
      dot: dataStale ? 'error' : connected ? 'live' : 'idle',
    },
  ];

  return (
    <div
      className="relative h-screen overflow-hidden p-1.5 flex flex-col gap-1.5"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <div className="shrink-0 flex justify-between items-center px-1" style={{ height: 20 }}>
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center justify-center rounded-md shrink-0 transition-colors"
            style={{
              width: 20,
              height: 20,
              color: 'var(--brand)',
              backgroundColor: 'var(--brand-dim)',
              border: '1px solid var(--border-default)',
            }}
          >
            {theme === 'dark'
              ? <Icon name="sun" size={12} strokeWidth={2.25} />
              : <Icon name="moon" size={12} strokeWidth={2.25} />}
          </button>
          <span className="flex items-center gap-1.5" style={{ color: 'var(--brand)' }}>
            <Icon name="calendar-clock" size={13} strokeWidth={2.25} className="shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {clock} PHT
            </span>
          </span>
        </span>
        <span
          className="font-semibold text-[11px] uppercase tracking-wide"
          style={{ color: 'var(--brand)' }}
        >
          USHER ERI VER. 2026.07.01
        </span>
      </div>

      {faults.length > 0 && (
        <div
          className="absolute top-0.5 right-1 z-50 w-[380px] max-w-[55%] flex items-center gap-1.5 px-2.5 py-1 rounded-md shadow-xl"
          style={{
            backgroundColor: hasCritical ? 'var(--status-error)' : 'var(--status-warn)',
            color: '#0a1018',
            height: 19,
          }}
        >
          <Icon name="alert-triangle" size={11} strokeWidth={2.5} className="shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-wide truncate">
            {faults.map((f) => f.message).join('  ·  ')}
          </span>
        </div>
      )}

      <div
        className="flex-1 min-h-0 w-full grid gap-1.5"
        style={{ gridTemplateColumns: 'minmax(0, 1.7fr) 44px minmax(0, 1fr)' }}
      >
        <div className="flex flex-col gap-1.5 min-h-0">
          <div className="flex-[2] min-h-0 flex flex-col">
            <IntensityDisplay
              intensity={displayIntensity}
              warningLevel={warningLevel}
              alertLevel={alertLevel}
            />
          </div>
          <div className="flex-[3] min-h-0 flex flex-col">
            {SeismogramComponent ? (
              <SeismogramComponent ref={accelRef} livePoint={currentData} isLive={connected} theme={theme} />
            ) : (
              <SeismogramFallback />
            )}
          </div>
        </div>

        <div className="min-h-0">
          <IntensityLegend currentLevel={displayIntensity} />
        </div>

        <div className="flex flex-col gap-1.5 min-h-0">
          <div className="flex-[3] flex flex-col gap-1.5 min-h-0">
            <div className="flex-[1] min-h-0">
              <ThresholdCard />
            </div>
            <div className="flex-[2] min-h-0">
              <SummaryCard
                peakAccel={peakAccel}
                noOfEvents={noOfEvents}
                dominantFreq={dominantFreq}
                maxDisp={maxDisp}
              />
            </div>
          </div>

          <div className="flex-[2] min-h-0">
            <StatusCard status={statusData} />
          </div>
        </div>
      </div>
    </div>
  );
}
