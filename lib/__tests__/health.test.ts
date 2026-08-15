import { describe, expect, it } from 'vitest';
import { parseHealthPayload } from '../health';

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
  });

  it('marks non-OK HTTP as down even if JSON looks healthy', () => {
    const snapshot = parseHealthPayload({ status: 'ok' }, false, 1200);
    expect(snapshot.status).toBe('down');
  });
});
