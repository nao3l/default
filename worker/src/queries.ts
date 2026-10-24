import type { AccessRecord } from './record';

export async function insertRecord(db: D1Database, r: AccessRecord): Promise<void> {
  await db
    .prepare(
      `INSERT INTO access_log
         (ts, ip, country, region, city, asn, as_org, user_agent, path, referrer, origin, session_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      r.ts,
      r.ip,
      r.country,
      r.region,
      r.city,
      r.asn,
      r.as_org,
      r.user_agent,
      r.path,
      r.referrer,
      r.origin,
      r.session_id,
    )
    .run();
}

export interface LogFilter {
  ip?: string;
  path?: string;
  since?: string;
  until?: string;
  limit: number;
}

export function parseFilter(params: URLSearchParams): LogFilter {
  const limit = Number.parseInt(params.get('limit') ?? '200', 10);
  const text = (key: string) => params.get(key)?.trim() || undefined;
  return {
    ip: text('ip'),
    path: text('path'),
    since: text('since'),
    until: text('until'),
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 1000) : 200,
  };
}

export async function listLogs(db: D1Database, f: LogFilter): Promise<AccessRecord[]> {
  const where: string[] = [];
  const args: unknown[] = [];
  if (f.ip) {
    where.push('ip = ?');
    args.push(f.ip);
  }
  if (f.path) {
    where.push('path LIKE ?');
    args.push(`%${f.path}%`);
  }
  if (f.since) {
    where.push('ts >= ?');
    args.push(f.since);
  }
  if (f.until) {
    where.push('ts <= ?');
    args.push(f.until);
  }
  const sql = `SELECT ts, ip, country, region, city, asn, as_org, user_agent, path, referrer, origin, session_id
     FROM access_log ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY ts DESC LIMIT ?`;
  const result = await db
    .prepare(sql)
    .bind(...args, f.limit)
    .all<AccessRecord>();
  return result.results;
}

export interface IpSummary {
  ip: string;
  views: number;
  sessions: number;
  country: string | null;
  as_org: string | null;
  first_seen: string;
  last_seen: string;
}

// 指定時間内の接続元ごとの閲覧数。多い順。大量アクセスの見つけ出しに使う
export async function summarizeByIp(db: D1Database, since: string): Promise<IpSummary[]> {
  const result = await db
    .prepare(
      `SELECT ip, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions,
              MAX(country) AS country, MAX(as_org) AS as_org,
              MIN(ts) AS first_seen, MAX(ts) AS last_seen
         FROM access_log WHERE ts >= ?
        GROUP BY ip ORDER BY views DESC LIMIT 100`,
    )
    .bind(since)
    .all<IpSummary>();
  return result.results;
}

export async function deleteOlderThan(db: D1Database, cutoff: string): Promise<void> {
  await db.prepare('DELETE FROM access_log WHERE ts < ?').bind(cutoff).run();
}
