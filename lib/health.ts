const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000').replace(
  /\/$/,
  ''
);

export const STATUS_PAGE_URL = 'https://stats.uptimerobot.com/eEV8dUAe3D';

export type HealthStatus = 'checking' | 'ok' | 'waking' | 'down';

export type HealthSnapshot = {
  status: Exclude<HealthStatus, 'checking' | 'waking'>;
  service: string | null;
  message: string;
  latencyMs: number | null;
  backendHost: string | null;
  checkedAt: string;
};

type BackendHealthPayload = {
  status?: unknown;
  service?: unknown;
  message?: unknown;
};

export function backendHost(): string | null {
  try {
    return new URL(BACKEND).host;
  } catch {
    return null;
  }
}

export function parseHealthPayload(
  payload: unknown,
  httpOk: boolean,
  latencyMs: number
): HealthSnapshot {
  const body =
    payload && typeof payload === 'object' ? (payload as BackendHealthPayload) : null;
  const service = typeof body?.service === 'string' ? body.service : null;
  const message =
    typeof body?.message === 'string'
      ? body.message
      : httpOk
        ? 'API reachable'
        : 'API did not respond';
  const reportedOk = typeof body?.status === 'string' && body.status.toLowerCase() === 'ok';

  return {
    status: httpOk && (body ? reportedOk : true) ? 'ok' : 'down',
    service,
    message,
    latencyMs,
    backendHost: backendHost(),
    checkedAt: new Date().toISOString(),
  };
}

export async function fetchBackendHealth(timeoutMs = 55_000): Promise<HealthSnapshot> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(BACKEND, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    const latencyMs = Date.now() - started;
    const payload: unknown = await response.json().catch(() => null);
    return parseHealthPayload(payload, response.ok, latencyMs);
  } catch {
    return {
      status: 'down',
      service: null,
      message: 'API unreachable or still cold-starting',
      latencyMs: Date.now() - started,
      backendHost: backendHost(),
      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}
