import { describe, expect, it } from 'vitest';
import { normalizeSensorConfig, createFallbackHistoryResponse, createFallbackStorageResponse } from './compat';

describe('frontend compatibility helpers', () => {
  it('fills missing threshold values from stored defaults', () => {
    const normalized = normalizeSensorConfig(
      {
        node_name: 'usher01',
        ctrlip: '192.168.10.12',
        ctrlport: 3000,
      },
      {
        warning: 4,
        warrant: 7,
        xthold: 0.001,
        ythold: 0.001,
        zthold: 0.001,
      }
    );

    expect(normalized.warning).toBe(4);
    expect(normalized.warrant).toBe(7);
    expect(normalized.node_name).toBe('usher01');
  });

  it('returns empty history and storage shapes when no backend data is available', () => {
    const history = createFallbackHistoryResponse();
    const storage = createFallbackStorageResponse();

    expect(history.history).toEqual([]);
    expect(history.totalEvents).toBe(0);
    expect(storage.sizeByte).toBe(0);
    expect(storage.freeByte).toBe(0);
  });
});
