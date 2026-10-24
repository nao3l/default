import { isAuthorized } from './auth';
import type { Env } from './env';
import { deleteOlderThan, insertRecord, listLogs, parseFilter, summarizeByIp } from './queries';
import { MAX_BODY_BYTES, buildRecord, isAllowedOrigin, retentionCutoff } from './record';
import { viewerHtml } from './viewer';

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...SECURITY_HEADERS,
    },
  });
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

// アプリからの閲覧通知を受け取り、1 行記録する
async function collect(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin');
  if (!isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
    return new Response(null, { status: 403 });
  }
  const headers = corsHeaders(origin!);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return new Response(null, { status: 413, headers });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400, headers });
  }

  const record = buildRecord(request.headers, request.cf as never, body, new Date());
  if (!record) return new Response(null, { status: 400, headers });

  await insertRecord(env.DB, record);
  return new Response(null, { status: 204, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (
      url.pathname === '/collect' &&
      (request.method === 'POST' || request.method === 'OPTIONS')
    ) {
      return collect(request, env);
    }

    if (url.pathname === '/' && request.method === 'GET') {
      const nonce = crypto.randomUUID().replace(/-/g, '');
      return new Response(viewerHtml(nonce), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'`,
          ...SECURITY_HEADERS,
        },
      });
    }

    if (url.pathname.startsWith('/api/')) {
      if (!(await isAuthorized(request, env.ADMIN_TOKEN)))
        return json({ error: 'unauthorized' }, 401);
      if (url.pathname === '/api/logs') {
        return json(await listLogs(env.DB, parseFilter(url.searchParams)));
      }
      if (url.pathname === '/api/summary') {
        const hours = Number.parseInt(url.searchParams.get('hours') ?? '24', 10);
        const h = Number.isFinite(hours) ? Math.min(Math.max(hours, 1), 24 * 90) : 24;
        const since = new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
        return json(await summarizeByIp(env.DB, since));
      }
    }

    return new Response('Not Found', { status: 404, headers: SECURITY_HEADERS });
  },

  // 毎日、保存期間を過ぎた記録を削除する
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await deleteOlderThan(env.DB, retentionCutoff(new Date(), env.RETENTION_DAYS));
  },
} satisfies ExportedHandler<Env>;
