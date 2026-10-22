import type { Annotation, Expression, Formality, Lang, Scene } from '../domain/expression';

export interface SearchFilters {
  query: string;
  scene: Scene | null;
  formality: Formality | null;
  lang: Lang | null;
  archaic: 'include' | 'only' | 'exclude';
  onlyUser: boolean;
  onlyFavorites: boolean;
}

export const EMPTY_FILTERS: SearchFilters = {
  query: '',
  scene: null,
  formality: null,
  lang: null,
  archaic: 'include',
  onlyUser: false,
  onlyFavorites: false,
};

export type SortOrder = 'relevance' | 'formality' | 'newest';

// 全角・半角、大文字・小文字、カタカナ・ひらがなの違いを吸収する
export function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s'’".,!?…]/g, '');
}

// 一致した項目の重みを合計する。0 は不一致。
function score(expression: Expression, terms: string[]): number {
  const fields: [string, number][] = [
    [expression.text, 10],
    [expression.reading ?? '', 8],
    [expression.keywords.join(' '), 6],
    [expression.meaning ?? '', 3],
    [expression.tags.join(' '), 2],
    [expression.examples.join(' '), 1],
  ];
  let total = 0;
  for (const term of terms) {
    const hit = fields.reduce(
      (sum, [text, w]) => sum + (normalize(text).includes(term) ? w : 0),
      0,
    );
    if (hit === 0) return 0;
    total += hit;
  }
  return total;
}

export function search(
  expressions: Expression[],
  annotations: Map<string, Annotation>,
  filters: SearchFilters,
  order: SortOrder = 'relevance',
): Expression[] {
  const terms = filters.query
    .split(/[\s\u3000]+/)
    .map(normalize)
    .filter(Boolean);

  const hits = expressions
    .filter((e) => {
      if (filters.scene && e.scene !== filters.scene) return false;
      if (filters.formality && e.formality !== filters.formality) return false;
      if (filters.lang && e.lang !== filters.lang) return false;
      if (filters.archaic === 'only' && !e.archaic) return false;
      if (filters.archaic === 'exclude' && e.archaic) return false;
      if (filters.onlyUser && e.source !== 'user') return false;
      if (filters.onlyFavorites && !annotations.get(e.id)?.favorite) return false;
      return true;
    })
    .map((e, index) => ({ e, index, score: terms.length ? score(e, terms) : 1 }))
    .filter((h) => h.score > 0);

  hits.sort((a, b) => {
    if (order === 'formality' && a.e.formality !== b.e.formality) {
      return a.e.formality - b.e.formality;
    }
    if (order === 'newest') {
      const byDate = (b.e.createdAt ?? '').localeCompare(a.e.createdAt ?? '');
      if (byDate !== 0) return byDate;
    }
    if (order === 'relevance' && a.score !== b.score) return b.score - a.score;
    return a.index - b.index;
  });

  return hits.map((h) => h.e);
}

// 日付ごとに決まった 1 件を選ぶ（同じ日なら何度開いても同じ表現）
export function pickOfTheDay(expressions: Expression[], date: Date): Expression | undefined {
  if (expressions.length === 0) return undefined;
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return expressions[hash % expressions.length];
}
