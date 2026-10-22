import {
  FORMALITY_LABELS,
  LANG_LABELS,
  SCENES,
  SCENE_LABELS,
  type Formality,
  type Lang,
} from '../../domain/expression';
import type { SearchFilters, SortOrder } from '../../search/search';

export function FilterBar({
  filters,
  onChange,
  order,
  onOrderChange,
}: {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  order: SortOrder;
  onOrderChange: (next: SortOrder) => void;
}) {
  const set = (patch: Partial<SearchFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="filters">
      <div className="chips" role="group" aria-label="場面">
        <button
          type="button"
          className="chip"
          aria-pressed={filters.scene === null}
          onClick={() => set({ scene: null })}
        >
          すべて
        </button>
        {SCENES.map((scene) => (
          <button
            key={scene}
            type="button"
            className="chip"
            aria-pressed={filters.scene === scene}
            onClick={() => set({ scene: filters.scene === scene ? null : scene })}
          >
            {SCENE_LABELS[scene]}
          </button>
        ))}
      </div>
      <div className="selects">
        <label>
          言語
          <select
            value={filters.lang ?? ''}
            onChange={(e) => set({ lang: (e.target.value || null) as Lang | null })}
          >
            <option value="">すべて</option>
            {(Object.keys(LANG_LABELS) as Lang[]).map((lang) => (
              <option key={lang} value={lang}>
                {LANG_LABELS[lang]}
              </option>
            ))}
          </select>
        </label>
        <label>
          格式
          <select
            value={filters.formality ?? ''}
            onChange={(e) =>
              set({ formality: e.target.value ? (Number(e.target.value) as Formality) : null })
            }
          >
            <option value="">すべて</option>
            {([1, 2, 3] as Formality[]).map((f) => (
              <option key={f} value={f}>
                {FORMALITY_LABELS[f]}
              </option>
            ))}
          </select>
        </label>
        <label>
          古風
          <select
            value={filters.archaic}
            onChange={(e) => set({ archaic: e.target.value as SearchFilters['archaic'] })}
          >
            <option value="include">含める</option>
            <option value="only">古風のみ</option>
            <option value="exclude">除く</option>
          </select>
        </label>
        <label>
          並び順
          <select value={order} onChange={(e) => onOrderChange(e.target.value as SortOrder)}>
            <option value="relevance">おすすめ順</option>
            <option value="formality">格式の低い順</option>
            <option value="newest">新しい順</option>
          </select>
        </label>
      </div>
    </div>
  );
}
