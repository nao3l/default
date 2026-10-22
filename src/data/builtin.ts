import { z } from 'zod';
import { builtinEntrySchema, type Expression } from '../domain/expression';

const files = import.meta.glob<{ default: unknown }>('./expressions/*.json', { eager: true });

// 収録データを検証して Expression に変換する。不正なデータはテストとビルドで検出する。
export function parseBuiltin(raw: Record<string, { default: unknown }>): Expression[] {
  const entries = Object.entries(raw).flatMap(([path, mod]) => {
    const result = z.array(builtinEntrySchema).safeParse(mod.default);
    if (!result.success) {
      throw new Error(`${path}: ${z.prettifyError(result.error)}`);
    }
    return result.data;
  });

  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) throw new Error(`収録データの id が重複しています: ${entry.id}`);
    seen.add(entry.id);
  }

  return entries
    .map((entry) => ({ ...entry, source: 'builtin' as const }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export const builtinExpressions: Expression[] = parseBuiltin(files);
