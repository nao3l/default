import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EMPTY_FILTERS, search } from '../../search/search';
import { useApp } from '../AppContext';
import { ExpressionList } from '../components/ExpressionList';

export function MinePage() {
  const { expressions, annotations } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'user' ? 'user' : 'favorites';

  const results = useMemo(
    () =>
      search(expressions, annotations, {
        ...EMPTY_FILTERS,
        onlyFavorites: tab === 'favorites',
        onlyUser: tab === 'user',
      }),
    [expressions, annotations, tab],
  );

  return (
    <>
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'favorites'}
          onClick={() => setParams({}, { replace: true })}
        >
          お気に入り
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'user'}
          onClick={() => setParams({ tab: 'user' }, { replace: true })}
        >
          登録した表現
        </button>
      </div>
      <ExpressionList
        key={tab}
        expressions={results}
        annotations={annotations}
        empty={
          tab === 'favorites'
            ? '気になる表現の詳細画面で「お気に入り」を押すと、ここに並びます。'
            : 'まだ登録した表現はありません。'
        }
      />
      {tab === 'user' && (
        <p className="more">
          <Link className="button" to="/new">
            表現を登録する
          </Link>
        </p>
      )}
    </>
  );
}
