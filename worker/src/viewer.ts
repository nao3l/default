// 記録の閲覧画面。記録された値は外部から送られた文字列を含むため、
// HTML として解釈させず、必ず textContent で表示する。
export function viewerHtml(nonce: string): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>閲覧記録 — 紳士の表現帳</title>
<style nonce="${nonce}">
  :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
  body { margin: 0; padding: 16px; max-width: 1200px; margin-inline: auto; }
  h1 { font-size: 1.3rem; } h2 { font-size: 1.05rem; margin-top: 28px; }
  form { display: flex; flex-wrap: wrap; gap: 8px; align-items: end; }
  label { display: grid; gap: 2px; font-size: .8rem; }
  input, button { font: inherit; padding: 6px 8px; }
  .wrap { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: .85rem; }
  th, td { border-bottom: 1px solid #8884; padding: 4px 6px; text-align: left; vertical-align: top; }
  td.ua { max-width: 280px; overflow-wrap: anywhere; }
  .muted { opacity: .7; } .error { color: #c33; }
  button.link { background: none; border: none; color: inherit; text-decoration: underline; cursor: pointer; padding: 0; }
</style>
</head>
<body>
<h1>閲覧記録</h1>
<form id="login">
  <label>合言葉<input id="token" type="password" autocomplete="current-password" required></label>
  <button>表示</button>
  <span class="muted">合言葉はこのタブを閉じると消えます</span>
</form>
<p id="status" class="error" role="alert"></p>

<section id="main" hidden>
  <h2>接続元ごとの閲覧数</h2>
  <form id="summary-form">
    <label>対象期間（時間）<input id="hours" type="number" min="1" max="2160" value="24"></label>
    <button>更新</button>
  </form>
  <div class="wrap"><table>
    <thead><tr><th>IP</th><th>閲覧数</th><th>タブ数</th><th>国・地域</th><th>ネットワーク</th><th>最初</th><th>最後</th></tr></thead>
    <tbody id="summary"></tbody>
  </table></div>

  <h2>閲覧の記録</h2>
  <form id="filter">
    <label>IP<input id="ip"></label>
    <label>ページ（部分一致）<input id="path"></label>
    <label>開始（UTC）<input id="since" placeholder="2026-10-24T00:00"></label>
    <label>終了（UTC）<input id="until"></label>
    <label>件数<input id="limit" type="number" min="1" max="1000" value="200"></label>
    <button>検索</button>
  </form>
  <div class="wrap"><table>
    <thead><tr><th>時刻（UTC）</th><th>IP</th><th>地域</th><th>ネットワーク</th><th>ページ</th><th>遷移元</th><th>タブ</th><th>ブラウザ</th></tr></thead>
    <tbody id="logs"></tbody>
  </table></div>
</section>

<script nonce="${nonce}">
const $ = (id) => document.getElementById(id);
const store = (() => { try { return sessionStorage; } catch { return null; } })();
let token = store?.getItem('token') ?? '';

function cell(text, cls) {
  const td = document.createElement('td');
  td.textContent = text ?? '';
  if (cls) td.className = cls;
  return td;
}
function ipCell(ip) {
  const td = document.createElement('td');
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'link'; b.textContent = ip;
  b.addEventListener('click', () => { $('ip').value = ip; loadLogs(); });
  td.append(b);
  return td;
}
async function api(path) {
  const res = await fetch(path, { headers: { Authorization: 'Bearer ' + token } });
  if (res.status === 401) throw new Error('合言葉が違います');
  if (!res.ok) throw new Error('読み込めませんでした（' + res.status + '）');
  return res.json();
}
async function loadSummary() {
  const rows = await api('/api/summary?hours=' + encodeURIComponent($('hours').value));
  $('summary').replaceChildren(...rows.map((r) => {
    const tr = document.createElement('tr');
    tr.append(ipCell(r.ip), cell(r.views), cell(r.sessions), cell(r.country), cell(r.as_org),
      cell(r.first_seen), cell(r.last_seen));
    return tr;
  }));
}
async function loadLogs() {
  const q = new URLSearchParams();
  for (const k of ['ip', 'path', 'since', 'until', 'limit']) if ($(k).value) q.set(k, $(k).value);
  const rows = await api('/api/logs?' + q);
  $('logs').replaceChildren(...rows.map((r) => {
    const tr = document.createElement('tr');
    const place = [r.country, r.region, r.city].filter(Boolean).join(' / ');
    const net = [r.asn ? 'AS' + r.asn : '', r.as_org].filter(Boolean).join(' ');
    tr.append(cell(r.ts), ipCell(r.ip), cell(place), cell(net), cell(r.path), cell(r.referrer),
      cell(r.session_id ? r.session_id.slice(0, 8) : ''), cell(r.user_agent, 'ua'));
    return tr;
  }));
}
async function show() {
  try {
    $('status').textContent = '';
    await Promise.all([loadSummary(), loadLogs()]);
    $('main').hidden = false;
  } catch (e) {
    $('status').textContent = e.message;
  }
}
$('login').addEventListener('submit', (e) => {
  e.preventDefault();
  token = $('token').value;
  store?.setItem('token', token);
  show();
});
$('summary-form').addEventListener('submit', (e) => { e.preventDefault(); loadSummary().catch((x) => $('status').textContent = x.message); });
$('filter').addEventListener('submit', (e) => { e.preventDefault(); loadLogs().catch((x) => $('status').textContent = x.message); });
if (token) show();
</script>
</body>
</html>`;
}
