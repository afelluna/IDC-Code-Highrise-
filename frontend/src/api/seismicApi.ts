import apiClient from './client';
import { getSourceApiBase, setSourceApiBaseFromConfig } from './runtimeConfig';
import io from 'socket.io-client';
import type {
  BackendResponse,
  SensorConfig,
} from './types';

async function getSensorConfig(): Promise<BackendResponse<SensorConfig>> {
  const response = await apiClient.get<SensorConfig>('/getSensorConfig');
  setSourceApiBaseFromConfig(response.data || {});
  return response;
}

function normalizeSourceSettings(data: any) {
  return {
    ...data,
    warning: data.warning ?? data.warning_min,
    warrant: data.warrant ?? data.alert_min,
    before: data.before ?? data.tbefore,
    after: data.after ?? data.tafter,
  };
}

async function getSourceSettings(): Promise<BackendResponse<any>> {
  const configResponse = await getSensorConfig();
  const nodeName = configResponse.data?.node_name;
  const sourceUrl = getSourceApiBase();

  try {
    const response = await apiClient.get<any>(
      '/getIntensitySettings',
      undefined,
      { baseUrl: sourceUrl },
    );
    const data = response.data || {};
    return {
      ...response,
      data: normalizeSourceSettings(data),
    };
  } catch {
    // Older MDC builds also expose settings through Socket.IO.
  }

  return new Promise((resolve, reject) => {
    const socket = io(sourceUrl, {
      transports: ['websocket', 'polling'],
    }) as any;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      socket.disconnect();
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject({ message: 'Timed out waiting for MDC settings', status: 408 });
    }, 8000);

    socket.on('connect', () => {
      socket.emit('request_settings', [nodeName || '']);
    });

    socket.on('fetch_settings', (settings: any) => {
      cleanup();
      resolve({
        success: true,
        message: 'MDC settings fetched',
        data: normalizeSourceSettings(settings || {}),
      });
    });

    socket.on('connect_error', (err: any) => {
      cleanup();
      reject({
        message: err?.message || 'Could not connect to MDC settings socket',
        status: 500,
      });
    });
  });
}

export const seismicApi = {
  // IDC configuration. In Highrise this also contains the MDC source
  // endpoint ({ ctrlip, ctrlport }) for live sensor data.
  getSensorConfig,

  // MDC settings include Highrise threshold values (warning/warrant).
  getSourceSettings,

  // Highrise event history lives on the MDC/gateway, not the IDC controller.
  getSeismicEvents: async (): Promise<BackendResponse<any>> => {
    await getSensorConfig();
    return apiClient.get('/getAllHistory', undefined, { baseUrl: getSourceApiBase() });
  },

  // Get maximum intensity history (paged)
  getHistoryMax: (): Promise<BackendResponse<any>> =>
    apiClient.get('/getHistoryMax'),

  // Get all maximum intensity history
  getAllHistoryMax: (): Promise<BackendResponse<any>> =>
    apiClient.get('/getAllHistoryMax', undefined, { timeout: 180000 }),

  // Get storage/disk space information
  getStorageInfo: (): Promise<BackendResponse<any>> =>
    apiClient.get('/getDiskSpace'),

  // Update intensity thresholds
  updateThresholds: (payload: {
    warning: number;
    warrant: number;
    xthold: number;
    ythold: number;
    zthold: number;
  }): Promise<BackendResponse<any>> =>
    apiClient.post('/updateIntensity', payload),

  // Calibrate the sensor
  calibrate: (): Promise<BackendResponse<any>> =>
    apiClient.post('/calibrate'),

  // Tech-support admin login. Backend plaintext-compares against
  // config_tbl.admin_def_username / admin_def_pass. After the client.ts
  // interceptor normalizes the response, a valid login is `success === true`.
  loginUser: (username: string, password: string): Promise<BackendResponse<any>> =>
    apiClient.post('/loginUser', { username, password }),

  // Change the device admin password (config_tbl.admin_def_pass).
  changePassword: (newpassword: string): Promise<BackendResponse<any>> =>
    apiClient.post('/changePass', { newpassword }),

  // Get waveform data before an event
  getWaveformBefore: (eventId: string, path: string): Promise<BackendResponse<any>> =>
    apiClient.post('/getBefore', { eventId, path }),

  // Get waveform data during an event
  getWaveformDuring: (eventId: string, path: string): Promise<BackendResponse<any>> =>
    apiClient.post('/getDuring', { eventId, path }),

  // Get waveform data after an event
  getWaveformAfter: (eventId: string, path: string): Promise<BackendResponse<any>> =>
    apiClient.post('/getAfter', { eventId, path }),

  // Download a backup zip/log for a specific date and hour
  getBackup: (startDate: string, hour: string): Promise<BackendResponse<any>> =>
    apiClient.get(`/backUp/${startDate}/${hour}`),

  // Get available hours for backup on a specific date
  getAvailableHours: (startDate: string): Promise<BackendResponse<string[]>> =>
    apiClient.get(`/availableHour/${startDate}`),
};

export default seismicApi;
