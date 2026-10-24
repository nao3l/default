// 閲覧記録の送信。IP や地域は受け口が通信から判定するので、ここからは送らない。
// 検索語など入力内容は含めず、開いた画面の場所だけを送る。

const endpoint = import.meta.env.VITE_ACCESS_LOG_URL || '';

export const accessLogEnabled = endpoint !== '';
export const accessLogRetentionDays = Number(import.meta.env.VITE_ACCESS_LOG_RETENTION_DAYS) || 90;

// タブごとのランダムな識別子。同じタブでの一連の閲覧をまとめて追えるようにする
function sessionId(): string | undefined {
  try {
    let id = sessionStorage.getItem('access-log-session');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('access-log-session', id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export function reportView(path: string): void {
  if (!accessLogEnabled) return;
  const body = JSON.stringify({
    path,
    referrer: document.referrer || undefined,
    sessionId: sessionId(),
  });
  // 文字列で送ると text/plain になり、事前確認の通信なしで届く。記録の失敗で画面を止めない
  try {
    if (navigator.sendBeacon?.(endpoint, body)) return;
  } catch {
    // 下の fetch で再試行する
  }
  fetch(endpoint, { method: 'POST', body, keepalive: true, mode: 'no-cors' }).catch(() => {});
}
