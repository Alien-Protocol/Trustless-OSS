const REMOTE_BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000').replace(
  /\/$/,
  ''
);

export function remoteBackendUrl(): string {
  return REMOTE_BACKEND;
}

export function backendUrl(path = ''): string {
  const normalized = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  if (typeof window !== 'undefined') {
    return `/api/backend${normalized}`;
  }
  return `${REMOTE_BACKEND}${normalized}`;
}
