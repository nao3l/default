# 閲覧記録（アクセスログ）

サイトの各画面が開かれるたびに、日時・接続元 IP・国や地域・通信事業者・ブラウザ・開いた画面を記録する仕組みです。
記録は Cloudflare Workers の受け口が受け取り、Cloudflare D1 に保存します。

## 仕組み

1. 閲覧者がアプリの画面を開くと、アプリが受け口（`/collect`）に「この画面を開いた」と通知する
2. 受け口は、通信そのものから Cloudflare が判定した IP・地域・通信事業者を付けて 1 行保存する
   - IP は通知の中身からは取らないので、閲覧者が書き換えて偽ることはできない
   - 登録されたサイト（`ALLOWED_ORIGINS`）以外からの通知は受け付けない
3. 受け口の URL を開くと閲覧画面が出る。合言葉を入れると、接続元ごとの閲覧数と記録の一覧を見られる
4. 毎日 1 回、保存日数（既定 90 日）を過ぎた記録を自動で削除する

| 記録する                                                     | 記録しない                                   |
| ------------------------------------------------------------ | -------------------------------------------- |
| 日時（UTC）、開いた画面、遷移元のページ                      | 検索した言葉、登録した表現、メモ             |
| 接続元 IP、国・地域・都市、通信事業者（AS 番号と名前）       | 氏名やアカウントなど、個人を直接特定する情報 |
| ブラウザの種類（User-Agent）                                 |                                              |
| タブごとのランダムな識別子（同じタブでの閲覧をまとめるため） |                                              |

## 限界

- VPN、プロキシ、Tor を使われると、本当の接続元はわからない
- JavaScript を止めている閲覧者や、通知を遮断する拡張機能を使う閲覧者は記録されない
- 受け口の URL を知っていれば、IP を伴う偽の通知（存在しない画面など）を送ることはできる。IP 自体は偽れない

## 導入手順

PC に開発環境を入れなくても、ブラウザでの操作だけで導入できます。

### 1. Cloudflare で準備する

1. **データベースを作る**：Cloudflare の管理画面 → Storage & Databases → D1 SQL Database → Create。名前は `phrasebook-access-log`。作成後に表示される **Database ID** を控える
2. **アカウント ID を控える**：管理画面のアカウントのトップ（または Workers & Pages の画面）に表示される **Account ID**
3. **API トークンを作る**：右上のプロフィール → My Profile → API Tokens → Create Token
   - テンプレート「Edit Cloudflare Workers」を選ぶ
   - Permissions に「Account / D1 / Edit」を追加する
   - Account Resources は自分のアカウントだけに絞る
   - 作成後に表示されるトークンを控える（再表示されない）
4. Workers を初めて使う場合は、Workers & Pages の画面で workers.dev のサブドメインを登録しておく

### 2. GitHub に登録する

リポジトリの Settings → Secrets and variables → Actions で登録します。

| 種類      | 名前                        | 値                                                   |
| --------- | --------------------------- | ---------------------------------------------------- |
| Secrets   | `CLOUDFLARE_API_TOKEN`      | 1-3 で作った API トークン                            |
| Secrets   | `ACCESS_LOG_ADMIN_TOKEN`    | 閲覧画面の合言葉。推測されにくい 32 文字以上の文字列 |
| Variables | `CLOUDFLARE_ACCOUNT_ID`     | 1-2 の Account ID                                    |
| Variables | `D1_DATABASE_ID`            | 1-1 の Database ID                                   |
| Variables | `ACCESS_LOG_RETENTION_DAYS` | （任意）保存日数。省略すると 90                      |

### 3. 受け口を公開する

Actions → 「Deploy access log worker」→ Run workflow。
成功すると、ログの「受け口を公開」の段に `https://phrasebook-access-log.<サブドメイン>.workers.dev` が表示される。

### 4. サイトとつなぐ

1. Variables に `ACCESS_LOG_URL` を追加し、値を 3 の URL の末尾に `/collect` を付けたものにする
2. Actions → 「Deploy to GitHub Pages」→ Run workflow でサイトを作り直す
3. サイトの「設定」画面に「アクセス記録について」が表示されれば、記録が始まっている

### 5. 記録を見る

受け口の URL（3 の URL そのもの）をブラウザで開き、合言葉を入れる。

- 「接続元ごとの閲覧数」：指定した時間内の IP ごとの閲覧数。多い順。大量アクセスの発見に使う
- 「閲覧の記録」：1 件ずつの記録。IP をクリックすると、その IP の記録だけに絞り込める

## 運用

- 合言葉を変える：Secrets の `ACCESS_LOG_ADMIN_TOKEN` を変え、3 を再実行する
- 記録を止める：Variables の `ACCESS_LOG_URL` を消し、サイトを作り直す
- 受け付けるサイトを変える：`worker/wrangler.toml` の `ALLOWED_ORIGINS` を変え、3 を再実行する
- 費用：個人サイトの規模なら Workers と D1 の無料枠に収まる見込み（D1 の無料枠は 1 日 10 万件の書き込み）
