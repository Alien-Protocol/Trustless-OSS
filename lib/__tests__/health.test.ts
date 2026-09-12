import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseHealthPayload, waitForBackendReady } from '../health';

describe('parseHealthPayload', () => {
  it('maps a healthy backend payload', () => {
    const snapshot = parseHealthPayload(
      {
        service: 'trustless-oss-backend',
        status: 'ok',
        message: 'Trustless-OSS Rust backend is running.',
      },
      true,
      42
    );

    expect(snapshot.status).toBe('ok');
    expect(snapshot.service).toBe('trustless-oss-backend');
    expect(snapshot.latencyMs).toBe(42);
    expect(snapshot.message).toContain('running');
    expect(snapshot.failedDependency).toBeNull();
  });

  it('marks non-OK HTTP as down even if JSON looks healthy', () => {
    const snapshot = parseHealthPayload({ status: 'ok' }, false, 1200);
    expect(snapshot.status).toBe('down');
  });

  it('surfaces Redis as a persistent dependency failure', () => {
    const snapshot = parseHealthPayload(
      {
        status: 'unhealthy',
        checks: {
          database: { status: 'ok', latency: '1ms' },
          redis: { status: 'error', message: 'Redis unavailable' },
        },
      },
      false,
      900
    );

    expect(snapshot.status).toBe('down');
    expect(snapshot.failedDependency).toBe('redis');
    expect(snapshot.message).toContain('Redis is unavailable');
  });
});

describe('waitForBackendReady', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not keep polling when Redis is unavailable', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        status: 'unhealthy',
        checks: { redis: { status: 'error', message: 'Redis unavailable' } },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const snapshot = await waitForBackendReady(20_000);

    expect(snapshot.failedDependency).toBe('redis');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
