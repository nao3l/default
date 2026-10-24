import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('reportView', () => {
  it('受け口が未設定なら何も送らない', async () => {
    vi.stubEnv('VITE_ACCESS_LOG_URL', '');
    const beacon = vi.fn(() => true);
    vi.stubGlobal('navigator', { sendBeacon: beacon });
    const { reportView, accessLogEnabled } = await import('./accessLog');
    reportView('/');
    expect(accessLogEnabled).toBe(false);
    expect(beacon).not.toHaveBeenCalled();
  });

  it('画面の場所とタブの識別子を送り、同じタブでは識別子が変わらない', async () => {
    vi.stubEnv('VITE_ACCESS_LOG_URL', 'https://log.example/collect');
    const beacon = vi.fn<(url: string, body: string) => boolean>(() => true);
    vi.stubGlobal('navigator', { sendBeacon: beacon });
    const { reportView } = await import('./accessLog');

    reportView('/');
    reportView('/e/builtin-0001');

    expect(beacon).toHaveBeenCalledTimes(2);
    const [url, first] = beacon.mock.calls[0];
    const second = JSON.parse(beacon.mock.calls[1][1]);
    expect(url).toBe('https://log.example/collect');
    expect(JSON.parse(first).path).toBe('/');
    expect(second.path).toBe('/e/builtin-0001');
    expect(second.sessionId).toBe(JSON.parse(first).sessionId);
    expect(Object.keys(second)).not.toContain('ip');
  });

  it('sendBeacon が使えなければ fetch で送り、失敗しても例外を出さない', async () => {
    vi.stubEnv('VITE_ACCESS_LOG_URL', 'https://log.example/collect');
    vi.stubGlobal('navigator', {});
    const fetchMock = vi.fn(() => Promise.reject(new Error('offline')));
    vi.stubGlobal('fetch', fetchMock);
    const { reportView } = await import('./accessLog');
    expect(() => reportView('/mine')).not.toThrow();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://log.example/collect',
      expect.objectContaining({ method: 'POST', keepalive: true }),
    );
  });
});
