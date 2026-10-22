import { useState, type ChangeEvent } from 'react';
import { useApp } from '../AppContext';
import { applyTheme, loadTheme, type Theme } from '../theme';

export function SettingsPage() {
  const { repository, reload, expressions, annotations } = useApp();
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [status, setStatus] = useState('');

  const userCount = expressions.filter((e) => e.source === 'user').length;
  const builtinCount = expressions.length - userCount;
  const favoriteCount = [...annotations.values()].filter((a) => a.favorite).length;

  const exportJson = async () => {
    const data = await repository.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phrasebook-${data.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('書き出しました');
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const result = await repository.importData(JSON.parse(await file.text()));
      await reload();
      setStatus(
        `表現 ${result.expressions} 件、メモ・お気に入り ${result.annotations} 件を読み込みました`,
      );
    } catch {
      setStatus('読み込めませんでした。このアプリで書き出した JSON ファイルか確認してください。');
    }
  };

  return (
    <div className="settings">
      <section>
        <h2>書き出し・読み込み</h2>
        <p>
          登録した表現、お気に入り、メモを JSON
          ファイルで保存・復元できます。機種変更やバックアップに。
        </p>
        <div className="actions">
          <button type="button" className="button" onClick={exportJson}>
            書き出す
          </button>
          <label className="button">
            読み込む
            <input type="file" accept="application/json,.json" hidden onChange={importJson} />
          </label>
        </div>
        <p className="status" role="status">
          {status}
        </p>
      </section>

      <section>
        <h2>表示</h2>
        <label>
          テーマ
          <select
            value={theme}
            onChange={(e) => {
              const next = e.target.value as Theme;
              setTheme(next);
              applyTheme(next);
            }}
          >
            <option value="system">端末の設定に合わせる</option>
            <option value="light">ライト</option>
            <option value="dark">ダーク</option>
          </select>
        </label>
      </section>

      <section>
        <h2>このアプリについて</h2>
        <p>
          収録表現 {builtinCount} 件 / 登録した表現 {userCount} 件 / お気に入り {favoriteCount} 件
        </p>
        <p>登録した内容はこの端末のブラウザ内にだけ保存され、外部には送信されません。</p>
      </section>
    </div>
  );
}
