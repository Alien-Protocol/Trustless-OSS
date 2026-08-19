import { NextRequest, NextResponse } from 'next/server';
import { remoteBackendUrl } from '@/lib/backend';

export const maxDuration = 60;

const PROXY_TIMEOUT_MS = 55_000;
const PROXY_ATTEMPTS = 3;

const HOP_BY_HOP = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const cause =
    'cause' in error && error.cause instanceof Error
      ? `${error.cause.name} ${error.cause.message}`
      : '';
  const haystack = `${error.name} ${error.message} ${cause}`;
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|UND_ERR_SOCKET|socket hang up|fetch failed|aborted|timeout/i.test(
    haystack
  );
}

async function proxy(request: NextRequest, path: string[]): Promise<Response> {
  const target = `${remoteBackendUrl()}/${path.join('/')}${request.nextUrl.search}`;
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  headers.delete('accept-encoding');

  const body =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();

  let lastError: unknown;

  for (let attempt = 1; attempt <= PROXY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(target, {
        method: request.method,
        headers,
        body: body && body.byteLength > 0 ? body : undefined,
        cache: 'no-store',
        redirect: 'manual',
        signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
      });

      const outbound = new Headers();
      response.headers.forEach((value, key) => {
        if (!HOP_BY_HOP.has(key.toLowerCase())) {
          outbound.set(key, value);
        }
      });

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: outbound,
      });
    } catch (error: unknown) {
      lastError = error;
      if (attempt < PROXY_ATTEMPTS && isRetryableNetworkError(error)) {
        await sleep(2000 * attempt);
        continue;
      }
      break;
    }
  }

  const detail = lastError instanceof Error ? lastError.message : 'connection reset';
  return NextResponse.json(
    {
      error: `${remoteBackendUrl()} is waking up or temporarily unavailable.`,
      detail,
    },
    { status: 502 }
  );
}

async function handler(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!path?.length) {
    return NextResponse.json({ error: 'Missing backend path' }, { status: 400 });
  }
  return proxy(request, path);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
