import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { pickOfTheDay, search, type SearchFilters, type SortOrder } from '../../search/search';
import { useApp } from '../AppContext';
import { ExpressionList } from '../components/ExpressionList';
import { FilterBar } from '../components/FilterBar';
import { filtersFromParams, orderFromParams, toParams } from '../filterParams';

export function HomePage() {
  const { expressions, annotations, loading } = useApp();
  const [params, setParams] = useSearchParams();
  const filters = filtersFromParams(params);
  const order = orderFromParams(params);

  // 描画時点の条件ではなく、直前に反映した条件を基準に更新する。
  // 再描画の前に続けて操作されても、先に選んだ条件が消えないようにするため
  // （React Router の関数形式の更新も描画時点の値を基準にするので、自前で保持する）
  const latest = useRef(params);
  useEffect(() => {
    latest.current = params;
  }, [params]);

  const update = (patch: Partial<SearchFilters>, nextOrder?: SortOrder) => {
    const prev = latest.current;
    const next = toParams(
      { ...filtersFromParams(prev), ...patch },
      nextOrder ?? orderFromParams(prev),
    );
    latest.current = next;
    setParams(next, { replace: true });
  };

  const results = useMemo(
    () => search(expressions, annotations, filters, order),
    // filters は params から毎回作られるため、params を依存に使う
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expressions, annotations, params],
  );
  const today = useMemo(
    () =>
      pickOfTheDay(
        expressions.filter((e) => e.source === 'builtin'),
        new Date(),
      ),
    [expressions],
  );

  return (
    <>
      {today && (
        <section className="today" aria-labelledby="today-title">
          <h2 id="today-title">今日の一言</h2>
          <Link to={`/e/${today.id}`} className="today-text" lang={today.lang}>
            {today.text}
          </Link>
          {today.meaning && <p className="today-meaning">{today.meaning}</p>}
        </section>
      )}

      <div role="search" className="search">
        <input
          type="search"
          aria-label="表現を検索"
          placeholder="例：ありがとう、断る、obliged"
          value={filters.query}
          onChange={(e) => update({ query: e.target.value })}
        />
      </div>

      <FilterBar
        filters={filters}
        onChange={(patch) => update(patch)}
        order={order}
        onOrderChange={(next) => update({}, next)}
      />

      <p className="count" aria-live="polite">
        {loading ? '読み込み中…' : `${results.length} 件`}
      </p>
      <ExpressionList
        key={params.toString()}
        expressions={results}
        annotations={annotations}
        empty="該当する表現がありません。言葉を変えるか、絞り込みを外してみてください。"
      />
    </>
  );
}
