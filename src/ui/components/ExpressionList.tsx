import { useEffect, useRef, useState } from 'react';
import type { Annotation, Expression } from '../../domain/expression';
import { ExpressionCard } from './ExpressionCard';

const PAGE_SIZE = 30;

// 件数が増えても重くならないよう、スクロールに合わせて少しずつ描画する
export function ExpressionList({
  expressions,
  annotations,
  empty,
}: {
  expressions: Expression[];
  annotations: Map<string, Annotation>;
  empty: string;
}) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = limit < expressions.length;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setLimit((n) => n + PAGE_SIZE);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  if (expressions.length === 0) return <p className="empty">{empty}</p>;

  return (
    <>
      <ul className="card-list">
        {expressions.slice(0, limit).map((e) => (
          <ExpressionCard
            key={e.id}
            expression={e}
            favorite={annotations.get(e.id)?.favorite ?? false}
          />
        ))}
      </ul>
      {hasMore && (
        <div ref={sentinel} className="more">
          <button type="button" className="button" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
            さらに表示
          </button>
        </div>
      )}
    </>
  );
}
