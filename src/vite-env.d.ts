/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 閲覧記録の受け口（Cloudflare Workers の /collect）。未設定なら記録しない
  readonly VITE_ACCESS_LOG_URL?: string;
  // 告知文に出す保存日数。受け口の RETENTION_DAYS と同じ値にする
  readonly VITE_ACCESS_LOG_RETENTION_DAYS?: string;
}
