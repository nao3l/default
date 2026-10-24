# 紳士の表現帳

気品ある日本語・英語の表現を場面ごとに引ける Web アプリ。設計は `docs/DESIGN.md`。

## 構成

- TypeScript + React + Vite の静的サイト。サーバーなし。GitHub Pages と Cloudflare Workers（名前 `default`、設定は最上位の `wrangler.jsonc`）の両方で公開
- `src/data/expressions/<scene>.json` 収録表現（場面ごとに 1 ファイル）
- `src/domain/` 型と Zod スキーマ
- `src/store/` リポジトリ層。収録データと IndexedDB（登録表現・お気に入り・メモ）を統合する唯一の窓口
- `src/search/` 端末内検索（正規化した部分一致 + 重み付け）
- `src/telemetry/` 閲覧記録の送信。受け口の URL（`VITE_ACCESS_LOG_URL`）が未設定なら何もしない
- `worker/` 閲覧記録の受け口（Cloudflare Workers + D1）。別パッケージ。手順は `docs/ACCESS_LOG.md`
- `src/ui/` 画面。ルーティングは HashRouter（GitHub Pages で深い URL を開けるようにするため）

## コマンド

- `npm run check` 型チェック・リント・整形確認・単体テストをまとめて実行。プッシュ前に必ず通す
- `npm run test:e2e` Playwright の E2E テスト（ビルドしてから起動する）
- `npm run dev` 開発サーバー
- `cd worker && npm run typecheck && npm test` 受け口の型チェックとテスト

## 収録表現の追加

- 該当する場面の JSON に追記する。`id` は `builtin-NNNN` の連番で、既存の id は変えない
- 必須: `id` `text` `lang` `scene` `formality`(1〜3) `archaic` `examples` `tags` `keywords`
- 言語は `ja` `en` `fr` `de` `it` `es`。各場面にすべての言語が 1 件以上あることをテストで検査している
- 日本語は `reading` を必ず付ける。`keywords` には「ありがとう」「thanks」など、検索で引かれたい言い換え語を入れる
- `citation`（書名・発行元・URL）は、実際に開いて内容を確かめたページだけを書く。優先順は公的機関（文化庁など）→ 辞書出版社の辞書（デジタル大辞泉、Cambridge、Oxford Learner's、Merriam-Webster など）。確かめられなければ項目ごと省く（画面には「出典未詳」と出る）
- `npm test` が形式・重複・場面の不一致を検査する
