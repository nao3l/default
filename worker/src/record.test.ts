import { describe, expect, it } from 'vitest';
import { buildRecord, isAllowedOrigin, retentionCutoff } from './record';
import { isAuthorized } from './auth';

const now = new Date('2026-10-24T03:00:00.000Z');
const headers = (extra: Record<string, string> = {}) =>
  new Headers({
    'CF-Connecting-IP': '203.0.113.7',
    'User-Agent': 'Mozilla/5.0 Test',
    Origin: 'https://nao3l.github.io',
    ...extra,
  });

describe('buildRecord', () => {
  it('IP と地域は通信側の値を使い、送信内容の IP は無視する', () => {
    const r = buildRecord(
      headers(),
      {
        country: 'JP',
        region: 'Tokyo',
        city: 'Chiyoda',
        asn: 64500,
        asOrganization: 'Example Net',
      },
      {
        path: '/e/builtin-0001',
        referrer: 'https://example.com/',
        sessionId: 'abcd1234-ef',
        ip: '1.1.1.1',
      },
      now,
    );
    expect(r).toMatchObject({
      ts: '2026-10-24T03:00:00.000Z',
      ip: '203.0.113.7',
      country: 'JP',
      asn: 64500,
      as_org: 'Example Net',
      path: '/e/builtin-0001',
      referrer: 'https://example.com/',
      session_id: 'abcd1234-ef',
    });
  });

  it('不正なページや形式は記録しない', () => {
    expect(buildRecord(headers(), undefined, { path: 'javascript:alert(1)' }, now)).toBeNull();
    expect(buildRecord(headers(), undefined, { path: 42 }, now)).toBeNull();
    expect(buildRecord(headers(), undefined, 'hello', now)).toBeNull();
  });

  it('制御文字を除き、長すぎる値は切り詰め、おかしなタブ識別子は捨てる', () => {
    const r = buildRecord(
      headers({ 'User-Agent': 'x'.repeat(900) }),
      undefined,
      { path: '/mine\u0000\n', sessionId: '<script>' },
      now,
    );
    expect(r?.path).toBe('/mine');
    expect(r?.user_agent).toHaveLength(500);
    expect(r?.session_id).toBeNull();
  });
});

describe('isAllowedOrigin', () => {
  it('登録したサイトだけを許可する', () => {
    const allowed = 'https://nao3l.github.io, http://localhost:5173';
    expect(isAllowedOrigin('https://nao3l.github.io', allowed)).toBe(true);
    expect(isAllowedOrigin('http://localhost:5173', allowed)).toBe(true);
    expect(isAllowedOrigin('https://evil.example', allowed)).toBe(false);
    expect(isAllowedOrigin(null, allowed)).toBe(false);
  });
});

describe('retentionCutoff', () => {
  it('保存日数より前の時刻を返し、不正な値なら 90 日とする', () => {
    expect(retentionCutoff(now, '30')).toBe('2026-09-24T03:00:00.000Z');
    expect(retentionCutoff(now, 'abc')).toBe('2026-07-26T03:00:00.000Z');
  });
});

describe('isAuthorized', () => {
  const req = (auth?: string) =>
    new Request('https://x/api/logs', auth ? { headers: { Authorization: auth } } : {});

  it('合言葉が一致したときだけ許可する', async () => {
    expect(await isAuthorized(req('Bearer s3cret'), 's3cret')).toBe(true);
    expect(await isAuthorized(req('Bearer wrong'), 's3cret')).toBe(false);
    expect(await isAuthorized(req(), 's3cret')).toBe(false);
  });

  it('合言葉が未設定なら誰にも見せない', async () => {
    expect(await isAuthorized(req('Bearer '), undefined)).toBe(false);
    expect(await isAuthorized(req('Bearer '), '')).toBe(false);
  });
});
