-- 閲覧記録。1 行が 1 回のページ表示
CREATE TABLE access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,            -- 受信時刻（UTC, ISO 8601）
  ip TEXT NOT NULL,            -- 接続元 IP（Cloudflare が通信から判定した値）
  country TEXT,                -- 国・地域コード
  region TEXT,                 -- 都道府県・州など
  city TEXT,
  asn INTEGER,                 -- 接続元のネットワーク番号
  as_org TEXT,                 -- 接続元のネットワーク事業者名
  user_agent TEXT,
  path TEXT NOT NULL,          -- 閲覧したページ（アプリ内の画面）
  referrer TEXT,               -- 遷移元
  origin TEXT,                 -- 送信元サイト
  session_id TEXT              -- タブごとの閲覧の区切り（ランダムな値、個人は特定しない）
);

CREATE INDEX access_log_ts ON access_log (ts);
CREATE INDEX access_log_ip_ts ON access_log (ip, ts);
