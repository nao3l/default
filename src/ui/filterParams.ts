import { LANGS, SCENES, type Formality, type Lang, type Scene } from '../domain/expression';
import { EMPTY_FILTERS, type SearchFilters, type SortOrder } from '../search/search';

// 絞り込み条件を URL に持たせ、詳細画面から戻っても条件が残るようにする
export function filtersFromParams(params: URLSearchParams): SearchFilters {
  const scene = params.get('scene');
  const formality = Number(params.get('formality'));
  const lang = params.get('lang');
  const archaic = params.get('archaic');
  return {
    ...EMPTY_FILTERS,
    query: params.get('q') ?? '',
    scene: SCENES.includes(scene as Scene) ? (scene as Scene) : null,
    formality: [1, 2, 3].includes(formality) ? (formality as Formality) : null,
    lang: LANGS.includes(lang as Lang) ? (lang as Lang) : null,
    archaic: archaic === 'only' || archaic === 'exclude' ? archaic : 'include',
  };
}

export function orderFromParams(params: URLSearchParams): SortOrder {
  const order = params.get('order');
  return order === 'formality' || order === 'newest' ? order : 'relevance';
}

export function toParams(filters: SearchFilters, order: SortOrder): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.scene) params.set('scene', filters.scene);
  if (filters.formality) params.set('formality', String(filters.formality));
  if (filters.lang) params.set('lang', filters.lang);
  if (filters.archaic !== 'include') params.set('archaic', filters.archaic);
  if (order !== 'relevance') params.set('order', order);
  return params;
}
