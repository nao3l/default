import { useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FORMALITY_LABELS,
  LANG_LABELS,
  SCENES,
  SCENE_LABELS,
  type Expression,
  type ExpressionDraft,
  type Formality,
  type Lang,
  type Scene,
} from '../../domain/expression';
import { useApp } from '../AppContext';

interface FormState {
  text: string;
  scene: Scene | '';
  reading: string;
  lang: Lang;
  formality: Formality;
  archaic: boolean;
  meaning: string;
  usage: string;
  examples: string;
  tags: string;
  keywords: string;
  citationTitle: string;
  citationPublisher: string;
  citationUrl: string;
}

const BLANK: FormState = {
  text: '',
  scene: '',
  reading: '',
  lang: 'ja',
  formality: 2,
  archaic: false,
  meaning: '',
  usage: '',
  examples: '',
  tags: '',
  keywords: '',
  citationTitle: '',
  citationPublisher: '',
  citationUrl: '',
};

function toForm(e: Expression): FormState {
  return {
    text: e.text,
    scene: e.scene,
    reading: e.reading ?? '',
    lang: e.lang,
    formality: e.formality,
    archaic: e.archaic,
    meaning: e.meaning ?? '',
    usage: e.usage ?? '',
    examples: e.examples.join('\n'),
    tags: e.tags.join('、'),
    keywords: e.keywords.join('、'),
    citationTitle: e.citation?.title ?? '',
    citationPublisher: e.citation?.publisher ?? '',
    citationUrl: e.citation?.url ?? '',
  };
}

const splitList = (text: string, separator: RegExp) =>
  text
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean);
const optional = (text: string) => text.trim() || undefined;

function toDraft(form: FormState, scene: Scene): ExpressionDraft {
  return {
    text: form.text.trim(),
    scene,
    reading: optional(form.reading),
    lang: form.lang,
    formality: form.formality,
    archaic: form.archaic,
    meaning: optional(form.meaning),
    usage: optional(form.usage),
    examples: splitList(form.examples, /\n/),
    tags: splitList(form.tags, /[、,]/),
    keywords: splitList(form.keywords, /[、,]/),
    citation: form.citationTitle.trim()
      ? {
          title: form.citationTitle.trim(),
          publisher: optional(form.citationPublisher),
          url: optional(form.citationUrl),
        }
      : undefined,
  };
}

// 英字だけの表現なら英語とみなす（登録時の手間を減らすため）
const guessLang = (text: string): Lang => (/^[\x20-\x7e’‘“”…]+$/.test(text.trim()) ? 'en' : 'ja');

export function EditPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { expressions, repository, reload } = useApp();
  const navigate = useNavigate();

  const editing = id ? expressions.find((e) => e.id === id && e.source === 'user') : undefined;
  const copyFrom = expressions.find((e) => e.id === params.get('from'));
  const initial = editing ?? copyFrom;

  const [form, setForm] = useState<FormState>(initial ? toForm(initial) : BLANK);
  const [langTouched, setLangTouched] = useState(Boolean(initial));
  const [detailsOpen, setDetailsOpen] = useState(Boolean(initial));
  const [error, setError] = useState('');

  if (id && !editing) return <p className="empty">編集できる表現が見つかりません。</p>;

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.text.trim() || !form.scene) {
      setError('「表現」と「場面」を入力してください。');
      return;
    }
    const draft = toDraft(form, form.scene);
    const saved = editing
      ? await repository.updateExpression(editing.id, draft)
      : await repository.createExpression(draft);
    await reload();
    navigate(`/e/${saved.id}`, { replace: true });
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <h2>{editing ? '表現を編集' : '表現を登録'}</h2>

      <label>
        表現 <span className="required">必須</span>
        <input
          value={form.text}
          onChange={(e) =>
            set({
              text: e.target.value,
              ...(langTouched ? {} : { lang: guessLang(e.target.value) }),
            })
          }
          placeholder="例：痛み入ります / I am much obliged."
        />
      </label>

      <label>
        場面 <span className="required">必須</span>
        <select value={form.scene} onChange={(e) => set({ scene: e.target.value as Scene })}>
          <option value="">選んでください</option>
          {SCENES.map((scene) => (
            <option key={scene} value={scene}>
              {SCENE_LABELS[scene]}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <details open={detailsOpen} onToggle={(e) => setDetailsOpen(e.currentTarget.open)}>
        <summary>詳しく書く</summary>
        <label>
          読み
          <input value={form.reading} onChange={(e) => set({ reading: e.target.value })} />
        </label>
        <label>
          言語
          <select
            value={form.lang}
            onChange={(e) => {
              setLangTouched(true);
              set({ lang: e.target.value as Lang });
            }}
          >
            {(Object.keys(LANG_LABELS) as Lang[]).map((lang) => (
              <option key={lang} value={lang}>
                {LANG_LABELS[lang]}
              </option>
            ))}
          </select>
        </label>
        <label>
          格式の高さ
          <select
            value={form.formality}
            onChange={(e) => set({ formality: Number(e.target.value) as Formality })}
          >
            {([1, 2, 3] as Formality[]).map((f) => (
              <option key={f} value={f}>
                {FORMALITY_LABELS[f]}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.archaic}
            onChange={(e) => set({ archaic: e.target.checked })}
          />
          古風な表現
        </label>
        <label>
          意味
          <textarea
            rows={2}
            value={form.meaning}
            onChange={(e) => set({ meaning: e.target.value })}
          />
        </label>
        <label>
          使いどころ・注意点
          <textarea rows={2} value={form.usage} onChange={(e) => set({ usage: e.target.value })} />
        </label>
        <label>
          例文（1 行に 1 つ）
          <textarea
            rows={3}
            value={form.examples}
            onChange={(e) => set({ examples: e.target.value })}
          />
        </label>
        <label>
          タグ（読点区切り）
          <input value={form.tags} onChange={(e) => set({ tags: e.target.value })} />
        </label>
        <label>
          検索用の言い換え語（読点区切り）
          <input
            value={form.keywords}
            onChange={(e) => set({ keywords: e.target.value })}
            placeholder="例：ありがとう、感謝"
          />
        </label>
        <label>
          出典（書名・ページ名）
          <input
            value={form.citationTitle}
            onChange={(e) => set({ citationTitle: e.target.value })}
            placeholder="空欄なら「出典未詳」と表示します"
          />
        </label>
        <label>
          出典の発行元
          <input
            value={form.citationPublisher}
            onChange={(e) => set({ citationPublisher: e.target.value })}
          />
        </label>
        <label>
          出典の URL
          <input
            type="url"
            value={form.citationUrl}
            onChange={(e) => set({ citationUrl: e.target.value })}
            placeholder="https://"
          />
        </label>
      </details>

      <div className="actions">
        <button type="submit" className="button button-primary">
          {editing ? '保存する' : '登録する'}
        </button>
        <button type="button" className="button" onClick={() => navigate(-1)}>
          やめる
        </button>
      </div>
    </form>
  );
}
