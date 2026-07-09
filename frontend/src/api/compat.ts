export interface CompatSensorConfig {
  warning?: number;
  warrant?: number;
  xthold?: number;
  ythold?: number;
  zthold?: number;
  node_name?: string;
  ctrlip?: string;
  ctrlport?: number;
  server_ip?: string;
}

export function normalizeSensorConfig(raw: any, fallback: Partial<CompatSensorConfig> = {}) {
  const normalized = {
    warning: raw?.warning ?? fallback.warning ?? 4,
    warrant: raw?.warrant ?? fallback.warrant ?? 7,
    xthold: raw?.xthold ?? fallback.xthold ?? 0.001,
    ythold: raw?.ythold ?? fallback.ythold ?? 0.001,
    zthold: raw?.zthold ?? fallback.zthold ?? 0.001,
    node_name: raw?.node_name ?? raw?.nodename ?? fallback.node_name ?? 'usher01',
    ctrlip: raw?.ctrlip ?? fallback.ctrlip ?? '',
    ctrlport: raw?.ctrlport ?? fallback.ctrlport ?? 3000,
    server_ip: raw?.server_ip ?? raw?.ctrlip ?? fallback.server_ip ?? '',
  };

  return normalized;
}

export function createFallbackHistoryResponse() {
  return {
    history: [],
    totalEvents: 0,
    uploadedCount: 0,
    unuploadedCount: 0,
  };
}

export function createFallbackStorageResponse() {
  return {
    sizeByte: 0,
    freeByte: 0,
  };
}
