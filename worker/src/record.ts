// 閲覧通知から保存する 1 行を組み立てる。
// IP と地域は通信から Cloudflare が判定した値を使い、送信内容（偽装できる）からは取らない。

export interface AccessRecord {
  ts: string;
  ip: string;
  country: string | null;
  region: string | null;
  city: string | null;
  asn: number | null;
  as_org: string | null;
  user_agent: string | null;
  path: string;
  referrer: string | null;
  origin: string | null;
  session_id: string | null;
}

export const MAX_BODY_BYTES = 2048;

interface CfInfo {
  country?: string;
  region?: string;
  city?: string;
  asn?: number;
  asOrganization?: string;
}

// 制御文字を除き、長さを制限する。記録した値は閲覧画面に出るため、ここで整えておく
function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const text = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return text ? text.slice(0, max) : null;
}

export function isAllowedOrigin(origin: string | null, allowed: string): boolean {
  if (!origin) return false;
  return allowed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(origin);
}

export function buildRecord(
  headers: Headers,
  cf: CfInfo | undefined,
  body: unknown,
  now: Date,
): AccessRecord | null {
  if (typeof body !== 'object' || body === null) return null;
  const data = body as Record<string, unknown>;

  const path = clean(data.path, 200);
  if (!path || !path.startsWith('/')) return null;

  const sessionId = typeof data.sessionId === 'string' ? data.sessionId : '';

  return {
    ts: now.toISOString(),
    ip: headers.get('CF-Connecting-IP') ?? 'unknown',
    country: clean(cf?.country, 8),
    region: clean(cf?.region, 100),
    city: clean(cf?.city, 100),
    asn: typeof cf?.asn === 'number' ? cf.asn : null,
    as_org: clean(cf?.asOrganization, 200),
    user_agent: clean(headers.get('User-Agent'), 500),
    path,
    referrer: clean(data.referrer, 500),
    origin: clean(headers.get('Origin'), 200),
    session_id: /^[A-Za-z0-9-]{8,64}$/.test(sessionId) ? sessionId : null,
  };
}

export function retentionCutoff(now: Date, days: string): string {
  const n = Number.parseInt(days, 10);
  const keep = Number.isFinite(n) && n > 0 ? n : 90;
  return new Date(now.getTime() - keep * 24 * 60 * 60 * 1000).toISOString();
}
