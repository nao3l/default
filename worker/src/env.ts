export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  RETENTION_DAYS: string;
  ADMIN_TOKEN?: string;
}
