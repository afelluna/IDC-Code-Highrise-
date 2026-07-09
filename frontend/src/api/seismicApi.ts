import apiClient from './client';
import type {
  BackendResponse,
  SensorConfig,
} from './types';
import { createFallbackHistoryResponse, createFallbackStorageResponse, normalizeSensorConfig } from './compat';

export const seismicApi = {
  // Get sensor configuration (thresholds, etc.)
  getSensorConfig: async (): Promise<BackendResponse<SensorConfig>> => {
    try {
      const res = await apiClient.get('/getSensorConfig');
      const data = res.data as any;
      return {
        ...res,
        data: normalizeSensorConfig(data, data),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Could not reach the device.',
        data: normalizeSensorConfig({}, {}),
      };
    }
  },

  // Get seismic events history
  getSeismicEvents: async (): Promise<BackendResponse<any>> => {
    try {
      return await apiClient.get('/getHistory');
    } catch {
      return {
        success: true,
        message: 'Using empty history fallback.',
        data: createFallbackHistoryResponse(),
      };
    }
  },

  // Get maximum intensity history (paged)
  getHistoryMax: async (): Promise<BackendResponse<any>> => {
    try {
      return await apiClient.get('/getHistoryMax');
    } catch {
      return {
        success: true,
        message: 'Using empty history fallback.',
        data: createFallbackHistoryResponse(),
      };
    }
  },

  // Get all maximum intensity history
  getAllHistoryMax: async (): Promise<BackendResponse<any>> => {
    try {
      return await apiClient.get('/getAllHistoryMax');
    } catch {
      return {
        success: true,
        message: 'Using empty history fallback.',
        data: createFallbackHistoryResponse(),
      };
    }
  },

  // Get storage/disk space information
  getStorageInfo: async (): Promise<BackendResponse<any>> => {
    try {
      return await apiClient.get('/getDiskSpace');
    } catch {
      return {
        success: true,
        message: 'Using empty storage fallback.',
        data: createFallbackStorageResponse(),
      };
    }
  },

  // Update intensity thresholds
  updateThresholds: async (payload: {
    warning: number;
    warrant: number;
    xthold: number;
    ythold: number;
    zthold: number;
  }): Promise<BackendResponse<any>> => {
    try {
      return await apiClient.post('/updateIntensity', payload);
    } catch {
      return {
        success: false,
        message: 'Threshold update is not supported by the current backend.',
        data: null,
      };
    }
  },

  // Calibrate the sensor
  calibrate: async (): Promise<BackendResponse<any>> => {
    try {
      return await apiClient.post('/calibrate');
    } catch {
      return {
        success: false,
        message: 'Calibration is not supported by the current backend.',
        data: null,
      };
    }
  },

  // Tech-support admin login. Backend plaintext-compares against
  // config_tbl.admin_def_username / admin_def_pass. After the client.ts
  // interceptor normalizes the response, a valid login is `success === true`.
  loginUser: async (username: string, password: string): Promise<BackendResponse<any>> => {
    try {
      return await apiClient.post('/loginUser', { username, password });
    } catch {
      return {
        success: false,
        message: 'Login endpoint is not available on the current backend.',
        data: null,
      };
    }
  },

  // Change the device admin password (config_tbl.admin_def_pass).
  changePassword: async (newpassword: string): Promise<BackendResponse<any>> => {
    try {
      return await apiClient.post('/changePass', { newpassword });
    } catch {
      return {
        success: false,
        message: 'Password change is not available on the current backend.',
        data: null,
      };
    }
  },

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
