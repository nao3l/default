import { Link } from 'react-router-dom';
import { FORMALITY_LABELS, SCENE_LABELS, type Expression } from '../../domain/expression';

export function ExpressionCard({
  expression,
  favorite,
}: {
  expression: Expression;
  favorite: boolean;
}) {
  return (
    <li>
      <Link to={`/e/${expression.id}`} className="card" lang={expression.lang}>
        <span className="card-text">{expression.text}</span>
        {expression.reading && <span className="card-reading">{expression.reading}</span>}
        {expression.meaning && (
          <span className="card-meaning" lang="ja">
            {expression.meaning}
          </span>
        )}
        <span className="badges" lang="ja">
          <span className="badge">{SCENE_LABELS[expression.scene]}</span>
          <span className="badge">{FORMALITY_LABELS[expression.formality]}</span>
          {expression.archaic && <span className="badge badge-accent">古風</span>}
          {expression.source === 'user' && <span className="badge badge-accent">自分の登録</span>}
          {favorite && (
            <span className="badge badge-fav" aria-label="お気に入り">
              ★
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}
