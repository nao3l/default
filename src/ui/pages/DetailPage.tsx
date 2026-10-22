import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FORMALITY_LABELS, LANG_LABELS, SCENE_LABELS } from '../../domain/expression';
import { useApp } from '../AppContext';
import { CitationText } from '../components/CitationText';

export function DetailPage() {
  const { id = '' } = useParams();
  const { expressions, annotations, repository, reload, loading } = useApp();
  const navigate = useNavigate();
  const expression = expressions.find((e) => e.id === id);
  const annotation = annotations.get(id);
  const [note, setNote] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  if (loading) return <p className="empty">読み込み中…</p>;
  if (!expression) {
    return (
      <p className="empty">
        表現が見つかりません。<Link to="/">探すへ戻る</Link>
      </p>
    );
  }

  const favorite = annotation?.favorite ?? false;
  const noteValue = note ?? annotation?.note ?? '';

  const toggleFavorite = async () => {
    await repository.saveAnnotation(id, { favorite: !favorite });
    await reload();
  };

  const saveNote = async () => {
    await repository.saveAnnotation(id, { note: noteValue.trim() });
    await reload();
    setNote(null);
    setStatus('メモを保存しました');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(expression.text);
      setStatus('コピーしました');
    } catch {
      setStatus('コピーできませんでした');
    }
  };

  const remove = async () => {
    if (!window.confirm(`「${expression.text}」を削除しますか？`)) return;
    await repository.deleteExpression(id);
    await reload();
    navigate('/mine?tab=user', { replace: true });
  };

  return (
    <article className="detail">
      <h2 className="detail-text" lang={expression.lang}>
        {expression.text}
      </h2>
      {expression.reading && <p className="detail-reading">{expression.reading}</p>}

      <p className="badges">
        <span className="badge">{SCENE_LABELS[expression.scene]}</span>
        <span className="badge">{FORMALITY_LABELS[expression.formality]}</span>
        <span className="badge">{LANG_LABELS[expression.lang]}</span>
        {expression.archaic && <span className="badge badge-accent">古風</span>}
        {expression.source === 'user' && <span className="badge badge-accent">自分の登録</span>}
        {expression.tags.map((tag) => (
          <span key={tag} className="badge">
            {tag}
          </span>
        ))}
      </p>

      <div className="actions">
        <button type="button" className="button" aria-pressed={favorite} onClick={toggleFavorite}>
          {favorite ? '★ お気に入り済み' : '☆ お気に入り'}
        </button>
        <button type="button" className="button" onClick={copy}>
          コピー
        </button>
      </div>
      <p className="status" role="status">
        {status}
      </p>

      <dl className="fields">
        {expression.meaning && (
          <>
            <dt>意味</dt>
            <dd>{expression.meaning}</dd>
          </>
        )}
        {expression.usage && (
          <>
            <dt>使いどころ</dt>
            <dd>{expression.usage}</dd>
          </>
        )}
        {expression.examples.length > 0 && (
          <>
            <dt>例文</dt>
            <dd>
              <ul className="examples" lang={expression.lang}>
                {expression.examples.map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>
            </dd>
          </>
        )}
        <dt>出典</dt>
        <dd>
          <CitationText citation={expression.citation} />
        </dd>
      </dl>

      <section className="note">
        <label htmlFor="note">自分用メモ</label>
        <textarea
          id="note"
          rows={3}
          placeholder="使った場面や、自分なりの使い方など"
          value={noteValue}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="button" className="button" onClick={saveNote} disabled={note === null}>
          メモを保存
        </button>
      </section>

      <div className="actions">
        {expression.source === 'user' ? (
          <>
            <Link className="button" to={`/e/${id}/edit`}>
              編集
            </Link>
            <button type="button" className="button button-danger" onClick={remove}>
              削除
            </button>
          </>
        ) : (
          <Link className="button" to={`/new?from=${id}`}>
            写して登録
          </Link>
        )}
      </div>
    </article>
  );
}
