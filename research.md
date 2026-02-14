# research.md

対象: `web-speed-hackathon-2025`  
参照した採点ロジック: `../web-speed-hackathon-2025-scoring-tool`

## 1) 仕様を「採点される受け入れ条件」に分解

### 1-1. 採点開始プロトコル（必須）
- 入力:
  - 採点ツールは `POST /api/initialize` を最初に実行する。
- 受け入れ条件:
  - ステータス `200` または `204` を返すこと（現実装は `200 {}`）。
  - DB 初期状態へ戻ること（スコアリングはこの前提）。
- 失敗条件:
  - 接続不可 / 200,204 以外で即失格（以降の計測に進まない）。

根拠:
- `../web-speed-hackathon-2025-scoring-tool/src/index.ts`
- `workspaces/server/src/api.ts:60`
- `docs/regulation.md`

### 1-2. ランディング9項目（900点）
- 入力（固定アクセス先）:
  - `/`
  - `/episodes/15792f69-bfa6-4c69-bb65-a674167e6d02`
  - `/episodes/a2cda25c-37f0-44e3-8b89-0f4546c6bf50`
  - `/timetable`
  - `/programs/3c1b6bea-47dd-46e9-bfa4-fa1b1552dc1d`
  - `/programs/8840e380-d456-456b-84ff-3a2c7326907c`
  - `/programs/7713a15b-e48a-4f67-9a1a-d894ee8f9eb3`
  - `/series/926d6852-c91e-4771-8e06-e7e90891061b`
  - `/404`
- 型/順序:
  - 各ページは順番に計測される（target list 固定順）。
  - `/timetable` `/programs/*` `/404` は mock date が入るケースあり（13:00）。
- エラー:
  - 120秒タイムアウト、または遷移失敗で当該項目0点。
- 境界値:
  - ネットワーク待機は `networkidle` + 追加リソース完了待ち。
  - `.m3u8` と `.ts` のみ監視対象から除外、その他は待機対象。

根拠:
- `../web-speed-hackathon-2025-scoring-tool/src/calculate.ts`
- `../web-speed-hackathon-2025-scoring-tool/src/scoring/calculate_*.ts`
- `../web-speed-hackathon-2025-scoring-tool/src/utils/go_to.ts`

### 1-3. ユーザーフロー4項目（200点, 条件付き）
- 実行条件:
  - ランディング合計が `200` 未満なら全スキップ（0点）。
- 入力/操作（固定シナリオ）:
  - 認証: 「ログイン」→「アカウントを新規登録する」→会員登録→ログアウト→ログイン
  - 番組表: 初回モーダル「試してみる」→`role="slider"` でドラッグ拡縮
  - 回遊A: ホームで `ゼロの使い魔F` リンク → `第3話 蝶兵衛、ついに食べた!`
  - 回遊B: 番組表で `/働きマン 第6話/` → モーダル「番組をみる」→ `/第4話 トロフィー泥棒/`
- 受け入れ条件:
  - 上記文言/ロールで要素が取得でき、遷移・表示が成功すること。
  - 計測指標は TBT + INP（各25点換算）。
- 失敗条件:
  - 要素未発見、文言不一致、待機タイムアウトで0点。

根拠:
- `../web-speed-hackathon-2025-scoring-tool/src/scoring/calculate_user_auth_flow_action.ts`
- `../web-speed-hackathon-2025-scoring-tool/src/scoring/calculate_timetable_gutter_control_flow_action.ts`
- `../web-speed-hackathon-2025-scoring-tool/src/scoring/calculate_home_series_episode_flow_action.ts`
- `../web-speed-hackathon-2025-scoring-tool/src/scoring/calculate_timetable_program_episode_flow_action.ts`

### 1-4. 動画再生2項目（100点）
- 入力:
  - エピソード再生: `/episodes/15792f69-bfa6-4c69-bb65-a674167e6d02`
  - 番組再生: `/programs/8840e380-d456-456b-84ff-3a2c7326907c`（13:00固定）
- 受け入れ条件:
  - `playing` イベントが20秒以内に発火すること。
  - `time origin` から `playing` までの ms でスコア計算。
- エラー/境界:
  - 20秒超でタイムアウト = 0点。
  - 実装上 `modified = joinTime - 800`（`max(0, ...)` ではない）。

根拠:
- `../web-speed-hackathon-2025-scoring-tool/src/scoring/calculate_episode_play_started_page.ts`
- `../web-speed-hackathon-2025-scoring-tool/src/scoring/calculate_program_play_started_page.ts`
- `../web-speed-hackathon-2025-scoring-tool/src/utils/measure_join_time.ts`

### 1-5. API入出力契約（主要）
- `GET /channels`:
  - 入力: `channelIds?: string`（`,` 区切り）
  - 出力: channel配列（id昇順）
- `GET /episodes`:
  - 入力: `episodeIds?: string`
  - 出力: episode配列 + `series.episodes`（`order` 昇順）
- `GET /series`:
  - 入力: `seriesIds?: string`
  - 出力: series配列 + `episodes`（`order` 昇順）
- `GET /timetable`:
  - 入力: `since`, `until`（date-time文字列）
  - 出力: program配列（`startAt` 昇順）
  - 備考: DB比較は時刻のみ + `+9 hours`
- `GET /programs`:
  - 入力: `programIds?: string`
  - 出力: program配列 + channel + episode.series.episodes（順序あり）
- `GET /recommended/:referenceId`:
  - 出力: module配列（`module.order` 昇順）+ items（`item.order` 昇順）
- 認証:
  - `POST /signIn`: 失敗 `401`
  - `POST /signUp`: 既存メール `400`
  - `GET /users/me`: 未認証 `401`
  - `POST /signOut`: 未認証 `401`

根拠:
- `workspaces/server/src/api.ts`
- `workspaces/schema/src/openapi/schema.ts`

## 2) 触るべきファイル候補（パス付き）と根拠

優先度 High（スコア直結）
- `workspaces/client/src/features/requests/schedulePlugin.ts`
  - 全APIに 1000ms 遅延を入れており、全シナリオの TBT/INP/LCP に直結。
- `workspaces/client/src/app/createRoutes.tsx`
  - `p-min-delay(..., 1000)` で全ページ lazy import 最低1秒遅延。
- `workspaces/server/src/ssr.tsx`
  - 全画像パス列挙 + 全 preload を毎リクエストで出力しており、HTML肥大化と初期負荷増。
- `workspaces/server/src/streams.tsx`
  - 番組ストリームで毎セグメント `randomBytes(3MB)` を生成しておりCPU/GCコスト大。
- `workspaces/server/src/index.ts`
  - 全レスポンス `cache-control: no-store` 固定で再利用不能。

優先度 Medium（再生/操作の安定）
- `workspaces/client/src/features/player/logics/create_player.ts`
  - プレイヤー初期化戦略（autoplay/muted/buffer）を統括。再生開始点数に直結。
- `workspaces/client/src/pages/episode/components/EpisodePage.tsx`
  - プレミアム判定・プレイヤー表示制御。ログイン時/未ログイン時の分岐維持が必須。
- `workspaces/client/src/pages/program/components/ProgramPage.tsx`
  - 放送前/中/後の分岐と自動遷移。mock date時の正しい画面状態に影響。
- `workspaces/client/src/pages/timetable/components/Gutter.tsx`
  - `role="slider"` とドラッグ処理。ユーザーフロー採点の必須セレクタ。
- `workspaces/client/src/features/layout/components/Layout.tsx`
  - ローディング表示やログイン/ログアウト導線、`getByRole` 対象ラベルが集約。

優先度 Medium（固定ID/固定文言依存の保全）
- `workspaces/server/database.sqlite`
  - 採点ツールは固定ID/固定タイトルで遷移するため、データ改変で壊れやすい。
- `workspaces/server/src/drizzle/database.ts`
  - `initialize` 時のDB初期化手順。採点前提条件の中核。
- `workspaces/client/src/features/auth/components/*.tsx`
  - ボタン/見出し文言が採点ロジックのセレクタとしてハードコードされている。
- `workspaces/client/src/pages/timetable/components/NewTimetableFeatureDialog.tsx`
  - 「試してみる」文言が固定依存。
- `workspaces/client/src/pages/timetable/components/ProgramDetailDialog.tsx`
  - 「番組をみる」文言が固定依存。

参照専用（採点仕様の実体）
- `../web-speed-hackathon-2025-scoring-tool/src/calculate.ts`
- `../web-speed-hackathon-2025-scoring-tool/src/scoring/*.ts`
- `../web-speed-hackathon-2025-scoring-tool/src/utils/*.ts`

## 3) 既存の実装パターン

### 3-1. ルーティング
- サーバー:
  - Fastifyで `/api`（JSON API）, `/streams`（静的+動的m3u8）, `/*`（SSR）を分離。
- クライアント:
  - React Router v7 の `lazy()` + loader prefetch を採用。
  - `Document` + `Layout` の外枠でモーダル/サイドバーを共通化。

### 3-2. バリデーション
- サーバー:
  - `fastify-zod-openapi` + `validatorCompiler`/`serializerCompiler`。
  - OpenAPIスキーマは `workspaces/schema/src/openapi/schema.ts` に集約。
- クライアント:
  - APIは `@better-fetch/fetch` の schema 指定で実行時検証。
  - 認証フォームは zod + 独自 `isValidEmail`/`isValidPassword`。

### 3-3. レスポンス形式
- APIは基本 `reply.code(200).send(...)`。
- 取得系は Drizzle relation を使った入れ子JSON（episode->series->episodes 等）。
- NotFoundは API では `404`、ページ側 `/404` は通常描画（200相当でSSR描画）。

### 3-4. DB/状態管理
- DB:
  - Drizzle + libsql (`file:`)。
  - `initializeDatabase()` で同梱 `database.sqlite` を `/tmp` にコピーして利用。
  - Program時刻はDB保存時に `HH:mm:ss` 化（日付を捨てる）し、比較時に現在日付へ再合成。
- フロント状態:
  - Zustand + lens の slice 構成（features/pages 分離）。
  - entityキャッシュ（programs/episodes/...）＋ selectors/hooks 参照。

## 4) 自動採点の罠チェック

### 4-1. フォーマット/文言
- UI文言が完全一致前提の箇所がある:
  - `ログイン`, `ログアウト`, `会員登録`, `アカウント作成`, `試してみる`, `番組をみる`
- `getByRole` 依存:
  - 見た目維持でも role/name が変わると失敗。

### 4-2. 順序/ソート
- API側で orderBy が多数あり、UIが先頭要素に依存。
- 番組表/シリーズ/レコメンドで順序が崩れると、採点ツールが想定リンクを見つけられない可能性。

### 4-3. ステータス
- `POST /api/initialize` は 200/204 必須。
- 認証系エラーコード（401/400）を変えると auth flow の期待挙動に影響。

### 4-4. 固定ID・固定データ
- 採点ツールは固定 UUID と固定タイトル（正規表現含む）に依存。
- `database.sqlite` 再生成や seed 変更で ID/文言が変わると採点シナリオ自体が壊れる。

### 4-5. タイムゾーン/丸め
- Luxon default zone は `Asia/Tokyo` 前提。
- DBの `program.startAt/endAt` は時刻のみ保持、SQL比較でも `+9 hours` が混在。
- mock date（13:00, 22:30）時に放送前/中/後分岐が成立することが必要。

### 4-6. null/空配列
- recommended item は `series`/`episode` が nullable。
- ここを非null前提で扱うとページ描画エラー→採点失敗の原因。

### 4-7. ネットワーク待機の罠
- `goTo` は `.m3u8/.ts` 以外のリクエスト完了を待つ。
- 長寿命リクエスト（analytics, SSE, poll 等）を増やすと 120s timeout を引き起こす。

## 5) 不明点（検証可否を分離）

### 5-1. すぐ検証できる不明点
- `POST /signIn` のレスポンス実体:
  - 実装は `ret` 生成後に `send(user)` しており、serializer挙動次第で返却形が変わる可能性。
  - 検証方法: ローカル起動して `curl -i /api/signIn`（未実施）。
- `/404` のHTTPステータス:
  - 画面としては描画されるが、ステータスコード運用を固定したい。
  - 検証方法: `curl -I /404`（未実施）。
- `workspaces/test` の現状通過可否:
  - VRT/手動チェックの代替として現状確認可能（未実施）。

### 5-2. すぐ検証できない不明点
- 本番採点環境（Chrome/CPU/ネットワーク）との差分。
- 大会運営が使用した最終レギュレーションチェック手順の内部詳細。
- Hidden case（公開されていない追加シナリオ）の有無。

### 5-3. 検証不能時に採用する仮定（保守的デフォルト）
- 仮定A: 採点は公開 scoring-tool 実装に忠実。
  - 方針: 文言/role/固定IDを維持し、非機能改善中心で攻める。
- 仮定B: レギュレーション遵守が最優先。
  - 方針: 見た目差分と機能落ちを発生させる変更は避け、`workspaces/test` を回帰ガードに使う。
- 仮定C: 時刻・順序は壊れやすい。
  - 方針: timezone/ソート/境界比較ロジックを変更する場合は最小差分かつ重点検証。

## 6) バンドルサイズ調査（2026-02-14）

### 6-1. 計測条件
- 実行日時: 2026-02-14 19:02 JST（`stats.builtAt = 2026-02-14T10:02:25.300Z`）
- 実行コマンド:
  - `pnpm run build`
  - `pnpm --filter @wsh-2025/client exec webpack --profile --json > /tmp/wsh-client-stats.json`
- 計測環境:
  - Node.js `v20.16.0`（`package.json` の想定 `22.14.0` とは差異あり）
- 対象:
  - クライアントバンドル: `workspaces/client/dist/*`
  - 配信静的アセット: `public/**/*`

### 6-2. クライアントバンドル（`workspaces/client/dist`）

| ファイル | Raw bytes | Raw MiB | gzip bytes | brotli bytes (q4) |
|---|---:|---:|---:|---:|
| `workspaces/client/dist/main.js` | 161,038,746 | 153.58 | 48,112,760 | 41,723,405 |
| `workspaces/client/dist/chunk-230d28e47995cc929a7d.js` | 70,732 | 0.07 | 20,996 | 21,579 |
| 合計 | 161,109,478 | 153.65 | 48,133,756 | 41,744,984 |

補足（`sourceMappingURL=data:...` のインラインsourcemap内訳）:
- `main.js`:
  - sourcemap本体: 83,731,948 bytes（79.85 MiB）
  - sourcemap除外後のコード本体: 77,306,798 bytes（73.73 MiB）
- `chunk-230d28e47995cc929a7d.js`:
  - sourcemap本体: 43,700 bytes
  - sourcemap除外後のコード本体: 27,032 bytes

### 6-3. 静的アセット（`public`）

総量:
- `public` 合計: 83,824,560 bytes（79.94 MiB, 52 files）

拡張子別:
- `svg`: 36,241,231 bytes（34.56 MiB, 13 files）
- `jpeg`: 35,050,573 bytes（33.43 MiB, 37 files）
- `gif`: 12,532,730 bytes（11.95 MiB, 1 file）
- `txt`: 26 bytes（1 file）

ディレクトリ別:
- `public/logos`: 34.56 MiB
- `public/images`: 33.43 MiB
- `public/animations`: 11.95 MiB

サイズ上位ファイル（Top 10）:
1. `public/animations/001.gif` - 12,532,730 bytes
2. `public/logos/soccer.svg` - 5,407,518 bytes
3. `public/logos/drama.svg` - 5,407,515 bytes
4. `public/logos/anime.svg` - 5,407,515 bytes
5. `public/logos/sumo.svg` - 3,599,111 bytes
6. `public/logos/shogi.svg` - 3,599,108 bytes
7. `public/logos/music.svg` - 3,599,108 bytes
8. `public/logos/mahjong.svg` - 3,599,108 bytes
9. `public/logos/fightingsports.svg` - 3,599,108 bytes
10. `public/images/011.jpeg` - 2,070,742 bytes

### 6-4. Webpack stats 上の肥大要因（`/tmp/wsh-client-stats.json`）

モジュールサイズ上位（抜粋）:
1. `@ffmpeg/core/dist/umd/ffmpeg-core.wasm?arraybuffer` - 42,976,689 bytes
2. `@iconify/json/json/fluent.json` - 10,591,195 bytes
3. `@iconify/json/json/material-symbols.json` - 7,153,550 bytes
4. `video.js/dist/video.es.js` - 1,850,031 bytes
5. `@iconify/json/json/line-md.json` - 1,280,850 bytes
6. `@iconify/json/json/bi.json` - 1,048,314 bytes
7. `@videojs/http-streaming/dist/videojs-http-streaming.es.js` - 996,830 bytes
8. `hls.js/dist/hls.mjs` - 870,209 bytes
9. `shaka-player/dist/shaka-player.compiled.js` - 683,373 bytes
10. `./assets/timetable/feature-explain.png` - 273,898.5 bytes

パッケージ集計上位（抜粋）:
1. `@ffmpeg/core` - 43,126,231 bytes
2. `@iconify/json` - 21,545,860 bytes
3. `video.js` - 1,850,031 bytes
4. `@videojs/http-streaming` - 996,830 bytes
5. `hls.js` - 870,209 bytes
6. `shaka-player` - 683,373 bytes
7. `(app)` - 815,318.5 bytes

### 6-5. まとめ（現状）
- 配信対象の総量（`workspaces/client/dist` + `public`）:
  - 244,934,038 bytes（233.59 MiB）
- 主な支配要因:
  - `main.js` の巨大化（特にインラインsourcemap）
  - `@ffmpeg/core` wasm と `@iconify/json` 大型JSON
  - `public/logos/*.svg` および `public/animations/001.gif`

### 6-6. 最適化後の再計測（2026-02-14）

実施した主変更:
- `workspaces/client/webpack.config.mjs`
  - `devtool: 'inline-source-map'` → `false`
  - `mode: 'none'` → `production`
  - `LimitChunkCountPlugin({ maxChunks: 1 })` を削除
  - `output.chunkFormat: false` を削除（動的importの分割を有効化）
  - `@babel/preset-env` に `exclude: ['proposal-dynamic-import', 'transform-dynamic-import']` を追加
  - `EnvironmentPlugin` から `NODE_ENV` の空文字指定を除去
- `workspaces/client/src/setups/unocss.ts`
  - 未使用 icon collection（`bx`, `fa-regular`）を削除
- `workspaces/client/src/pages/episode/components/PlayerController.tsx`
  - `SeekThumbnail` をホバー時に `lazy import` + `Suspense` で遅延ロード

再計測結果（`pnpm run build` 後）:
- `workspaces/client/dist/main.js`:
  - Before: 161,038,746 bytes（153.58 MiB）
  - After: 2,324,375 bytes（2.22 MiB）
  - 差分: -98.56%
- `main.js` gzip:
  - Before: 48,112,760 bytes
  - After: 518,406 bytes
  - 差分: -98.92%
- `workspaces/client/dist` 合計（全chunk合算）:
  - Before: 161,109,478 bytes（153.65 MiB）
  - After: 69,058,921 bytes（65.86 MiB）
  - 差分: -57.14%

最適化後のchunk構成（上位）:
1. `chunk-c494077961f21b9dcfed.js` - 42,976,947 bytes（`@ffmpeg/core.wasm`）
2. `chunk-3fae7f4231e95fcb8e17.js` - 10,664,832 bytes（`@iconify/json/fluent.json`）
3. `chunk-13605e61f69cf23f3784.js` - 7,212,171 bytes（`@iconify/json/material-symbols.json`）
4. `main.js` - 2,324,375 bytes（entrypoint）

所見:
- 初期エントリ (`main.js`) から巨大依存が分離され、初回ロードの転送量を大幅に削減。
- `@ffmpeg/core` と `@iconify/json` は依然として総量の支配要因だが、chunk分離により「必要時ロード」へ移行できた。

### 6-7. 最終集計（WebP移行 + JPEG削除後）

実施内容:
- `public/images/*.jpeg` を削除（37 files）。
- `public/images/*.webp`（37 files）を残し、`/public/images/:imageName` は `.jpeg` URL要求時に WebP を返せるように維持。

最終サイズ（実ファイル集計）:
- `workspaces/client/dist` 合計: 69,065,356 bytes（65.87 MiB）
- `public` 合計: 50,405,221 bytes（48.07 MiB）
- 配信対象合計（`dist + public`）: 119,464,142 bytes（113.93 MiB）

`public` の拡張子別内訳:
- `svg`: 36,241,231 bytes
- `gif`: 12,532,730 bytes
- `webp`: 1,631,234 bytes
- `txt`: 26 bytes
- `jpeg`: 0 bytes

比較（初回調査の総量 244,934,038 bytes 基準）:
- 119,464,142 bytes まで削減（-51.23%）

注記:
- 依存不足（`wireit` 未解決 + npm registry 到達不可）により、この段階での再ビルドは未実施。
- 上記は「現時点の出力済み `dist` と `public` の実ファイルサイズ」を再集計した結果。

## 7) 追加ボトルネック調査（2026-02-14）

### 7-1. 調査方針
- 対象: `workspaces/client/src` の描画・入力・時間更新・データ取得ロジック。
- 観点:
  - 常時ポーリング/ループ（`setInterval` / `setTimeout` / `setImmediate`）
  - ストア全体購読による再レンダリング連鎖
  - N件要素に対する重い処理/フェッチの重複
  - 重量依存の読み込み戦略

### 7-2. 重大ボトルネック（優先度順）

1. `setImmediate` 無限ループで pointer を全体ストア更新
   - 根拠:
     - `workspaces/client/src/features/layout/hooks/useSubscribePointer.ts:18`
     - `workspaces/client/src/features/layout/hooks/useSubscribePointer.ts:19`
   - 問題:
     - マウス移動の有無に関係なく `setImmediate` で常時 `updatePointer`。
     - これがグローバル状態変更になり、関連購読コンポーネントを高頻度で揺らす。
   - 影響:
     - CPU 常時使用、バッテリー消費増、FPS 低下、不要レンダリング増大。

2. `Hoverable` が毎レンダリングでレイアウト計測
   - 根拠:
     - `workspaces/client/src/features/layout/components/Hoverable.tsx:21`
     - `workspaces/client/src/features/layout/components/Hoverable.tsx:22`
   - 問題:
     - `getBoundingClientRect()` を pointer 変化ごとに大量要素で実行。
     - 上記 1 と組み合わさり、Recalculate Style / Layout が過密化。
   - 影響:
     - ホバー可能要素が多い画面（ホーム、番組表）でフレームドロップ。

3. `useScrollSnap` が間隔未指定 `setInterval`（実質 0ms）
   - 根拠:
     - `workspaces/client/src/features/recommended/hooks/useScrollSnap.ts:28`
   - 問題:
     - 監視ループが高頻度で回り続け、子要素位置計算と `scrollTo` 判定を常時実施。
   - 影響:
     - カルーセル未操作時も CPU を使い続ける。

4. 番組カードごとに時刻更新タイマーを増殖
   - 根拠:
     - `workspaces/client/src/pages/timetable/components/Program.tsx:28`
     - `workspaces/client/src/pages/timetable/hooks/useCurrentUnixtimeMs.ts:8`
   - 問題:
     - `Program` 各インスタンスで `useCurrentUnixtimeMs()` が実行され、250ms interval が番組数分生成。
   - 影響:
     - 番組表で要素数に比例してタイマー数が膨張。

5. 番組カードごとに追加の 250ms ポーリング（画像表示判定）
   - 根拠:
     - `workspaces/client/src/pages/timetable/components/Program.tsx:39`
   - 問題:
     - `title/image` 高さ判定を interval で常時実行。
   - 影響:
     - 番組数が多いほど DOM 読み取り負荷が線形増加。

6. ダイアログを閉じていても `episode` フェッチが走る構造
   - 根拠:
     - `workspaces/client/src/pages/timetable/components/Program.tsx:86`
     - `workspaces/client/src/pages/timetable/components/ProgramDetailDialog.tsx:17`
     - `workspaces/client/src/pages/timetable/hooks/useEpisode.ts:12`
   - 問題:
     - 各番組カードで `ProgramDetailDialog` を常時マウントし、`useEpisode(program.episodeId)` が実行される。
   - 影響:
     - 番組表表示だけで大量 API 呼び出し（またはバッチ要求）を誘発。

7. `useTimetable` の毎回全件再構築（O(channels * programs) + sort）
   - 根拠:
     - `workspaces/client/src/features/timetable/hooks/useTimetable.ts:16`
     - `workspaces/client/src/features/timetable/hooks/useTimetable.ts:25`
   - 問題:
     - ストア更新のたびに全チャンネル分の抽出・ソート・`DateTime.fromISO` を再実行。
   - 影響:
     - データ量増加時に描画レイテンシ悪化。

8. ストア全体購読 (`useStore((s) => s)`) が広範囲
   - 根拠:
     - `workspaces/client/src` 内で 24 箇所ヒット。
   - 問題:
     - 関係ない state 更新でも各 hook/コンポーネントが再レンダリング対象になる。
   - 影響:
     - 1〜7 の高頻度更新の被害範囲が全体に拡散。

9. レイアウト計算がポーリング依存（ResizeObserver 未使用）
   - 根拠:
     - `workspaces/client/src/features/recommended/hooks/useCarouselItemWidth.ts:14`
     - `workspaces/client/src/features/layout/components/AspectRatio.tsx:16`
     - `workspaces/client/src/pages/program/components/ProgramPage.tsx:63`
   - 問題:
     - 幅計算や放送状態判定を常時ポーリング。
   - 影響:
     - 実質的にアイドル時でも継続負荷が残る。

10. `SeekThumbnail` 生成処理が重すぎる（ネットワーク + wasm + CPU）
    - 根拠:
      - `workspaces/client/src/pages/episode/hooks/useSeekThumbnail.ts:20`
      - `workspaces/client/src/pages/episode/hooks/useSeekThumbnail.ts:30`
      - `workspaces/client/src/pages/episode/hooks/useSeekThumbnail.ts:44`
    - 問題:
      - HLS セグメント全取得 + FFmpeg 変換をブラウザ内で実施。
      - 生成した Object URL の明示 revoke がなく、メモリ滞留リスクあり。
    - 影響:
      - シーク時の体感遅延、端末発熱、モバイルでの不安定化。

11. `create_player.ts` が全プレイヤー実装を同時バンドル
    - 根拠:
      - `workspaces/client/src/features/player/logics/create_player.ts:1`
      - `workspaces/client/src/features/player/logics/create_player.ts:2`
      - `workspaces/client/src/features/player/logics/create_player.ts:3`
      - `workspaces/client/src/features/player/logics/create_player.ts:4`
    - 問題:
      - Hls.js / Shaka / Video.js を同一モジュール先頭で import。
      - 実際に使う `playerType` が1種でも他実装のパース/評価コストが入る。
    - 影響:
      - 再計測後もプレイヤー関連 chunk が重い主因として残存。

### 7-3. 「無駄なフロントロジック」総括
- イベント駆動で済む処理がポーリング化されている。
- ローカル状態で完結できる hover/寸法判定がグローバルストア経由になっている。
- selector の粒度が粗く、無関係更新まで再レンダリングが伝播している。
- 「閉じているUI」のデータ取得が抑制されていない。

### 7-4. 次アクション（実装順）
1. `useSubscribePointer` / `Hoverable` を CSS `:hover` ベースまたは局所イベント駆動に置換。
2. `useStore((s) => s)` を全廃し、最小 selector + shallow 比較へ分解。
3. 番組表: `currentUnixtimeMs` 更新をページ単位 1 本に集約、`ProgramDetailDialog` は開いたときだけ fetch。
4. `useScrollSnap` / `useCarouselItemWidth` / `AspectRatio` を `ResizeObserver` + イベント駆動へ置換。
5. `useSeekThumbnail` をサーバー生成サムネイル API へ移し、FFmpeg ブラウザ実行を撤去。
6. `create_player.ts` を player type ごとの dynamic import に分割し、不要実装を遅延ロード。

## 8) Lighthouse 初回計測（`light-house-test-first.json`）

### 8-1. 計測ソース
- 入力ファイル: `light-house-test-first.json`
- 計測時刻:
  - UTC: `2026-02-14T10:36:16.565Z`
  - JST: `2026-02-14 19:36:16`
- 対象 URL: `http://127.0.0.1:8000/`
- Lighthouse: `13.0.1`
- ブラウザ: `Chrome 144`（`Mozilla/5.0 ... Chrome/144.0.0.0 ...`）
- benchmarkIndex: `2809.5`

### 8-2. カテゴリスコア（初回）

| Category | Score |
|---|---:|
| Performance | 0 |
| Accessibility | 100 |
| Best Practices | 0 |
| SEO | 50 |

### 8-3. 主要メトリクス（初回）

| Metric | 値 |
|---|---:|
| FCP | 46.9 秒 |
| LCP | 114.9 秒 |
| Speed Index | 50.0 秒 |
| TTI | 117.1 秒 |
| TBT | 6,930 ms |
| Max Potential FID | 3,790 ms |
| CLS | 1.216 |

### 8-4. JSON から読める主要課題（初回）

1. コンソールエラーが大量発生
   - `errors-in-console`: score `0`
   - 件数: `39`
   - すべて `404`
   - 例: `/public/images/*.jpeg?version=...` の読み込み失敗
2. サーバー応答が遅い
   - `server-response-time`: 「ルート ドキュメントの読み込みに 9,800 ms」
3. メインスレッド負荷が高い
   - `mainthread-work-breakdown`: `15.3 秒`
   - `bootup-time`: `9.1 秒`
   - 内訳上位:
     - `scriptEvaluation`: `9024 ms`
     - `styleLayout`: `1989 ms`
     - `garbageCollection`: `1007 ms`
4. JS 由来の無駄が大きい
   - `unused-javascript`: 推定削減 `3,411 KiB`
   - 上位:
     - `chunk-f1ad8d...js`: `1,702 KiB` wasted
     - `main.js`: `1,293 KiB` wasted
5. SEO 失点の原因が明確
   - `is-crawlable`: `0`（`x-robots-tag: noindex`）
   - `meta-description`: `0`
   - `robots-txt`: `0`

### 8-5. 次回以降の更新ルール（暫定）

- 初回ベースラインは本節を基準にし、次回以降は同フォーマットで追記。
- Chrome 拡張の影響を避けるため、次回はクリーンプロファイルで再計測する。
  - 初回 JSON には `chrome-extension://...` のスクリプトが混在している。
- 進捗は下表を更新して比較する（まずは 1 行目を初回として固定）。

| Date (JST) | Source JSON | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | Console Errors |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2026-02-14 19:36 | `light-house-test-first.json` | 0 | 100 | 0 | 50 | 46.9s | 114.9s | 6930ms | 1.216 | 39 |

# 初回成績

## 9) 追加コード監査（2026-02-14）

### 9-1. 「大きい object を毎回 copy/update」観点の現状（未解消のみ）

1. `workspaces/client/src/features/timetable/hooks/useTimetable.ts:13`
   - `programs` の全件を都度走査してチャンネル別配列を再構築している。
   - 以前の二重ループ（`O(channels * programs)`）は解消済みだが、依然として「データ量に比例した再計算」は残る。

### 9-2. SPA遷移でなく `a` タグ遷移の箇所

- `workspaces/client/src` / `workspaces/server/src` のソース上にプレーンな `<a ...>` は見つからなかった（`rg "<a\\b"` 0件）。
- 画面遷移は `react-router` の `Link` / `NavLink` / `useNavigate` で実装されている。
  - 例: `workspaces/client/src/features/layout/components/Layout.tsx:63`
  - 例: `workspaces/client/src/features/recommended/components/EpisodeItem.tsx:22`
  - 例: `workspaces/client/src/features/series/components/SeriesEposideItem.tsx:21`

結論:
- 現状、コード上で「SPA遷移でない `a` タグ遷移」は確認できない。

### 9-3. N+1 観点の現状

- `workspaces/server/src/streams.tsx` の playlist 生成で発生していた N+1（ループ内 `findFirst`）は解消済み。
  - 現在は最初に `findMany` でチャンネル番組を一括取得し、ループ内はメモリ上で解決。
- `workspaces/server/src/api.ts` の主要取得系は `with` による一括取得で、同種のN+1は現時点で目立たない。

### 9-4. 静的アセット配信（gzip/cache-control）観点の現状

実装済み:
1. `workspaces/server/src/ssr.tsx:22`
   - `@fastify/static` に `preCompressed: true` を追加。
   - 拡張子別 `cache-control` を拡張（`js/css/json/map/mjs/wasm`, 画像/フォント系）。
2. `workspaces/server/src/streams.tsx:20`
   - `/streams` 静的配信に `cacheControl`, `etag`, `preCompressed` と `setHeaders` を追加。
   - `*.ts` は `public, max-age=31536000, immutable` を付与。
3. `workspaces/server/src/streams.tsx` の動的 m3u8
   - `playlist.m3u8` は `no-cache, max-age=0, must-revalidate` を付与。
4. `workspaces/server/tools/precompress_assets.mjs`
   - 起動前に `public`, `client/dist`, `streams` 配下の対象ファイルから `.br/.gz` を事前生成。
   - `workspaces/server/package.json` の `start` / `heroku-start` に組み込み済み。

### 9-5. 解消済み項目の削除方針（本更新で反映）

- 完全に解消済みの項目（旧 画像/動画最適化レポート、`streams` N+1 の「未解消扱い」）は削除または解消済みに更新した。

## 10) 変更差分総点検（採点急落の原因調査, 2026-02-14）

前提:
- 今回は「実装変更なし」で、`git diff` 全体を確認して採点悪化要因を洗い出した。
- 変更ファイルは 437 files（`git diff --stat`）。

### 10-1. P0（最優先）: `/episodes` `/series` `/programs` が実質空画面化

観測:
- Playwright（Chrome channel）で `networkidle` 後の DOM を確認すると、以下が成立:
  - `/episodes/15792f69-bfa6-4c69-bb65-a674167e6d02`: `bodyHtmlLen: 89`, `bodyTextLen: 0`, `video count: 0`
  - `/series/926d6852-c91e-4771-8e06-e7e90891061b`: `bodyHtmlLen: 89`, `bodyTextLen: 0`
  - `/programs/8840e380-d456-456b-84ff-3a2c7326907c`: `bodyHtmlLen: 89`, `bodyTextLen: 0`
- `/` と `/timetable` は大量DOMが描画される（完全停止ではない）。

追加観測:
- サーバーが埋め込む hydration data は動的ページでも `loaderData` が `null`:
  - `curl http://127.0.0.1:8000/episodes/...` -> `__staticRouterHydrationData={"loaderData":{"0":null,"0-1":null}}`
  - `curl http://127.0.0.1:8000/series/...` -> `{"0":null,"0-3":null}`
  - `curl http://127.0.0.1:8000/programs/...` -> `{"0":null,"0-2":null}`

差分上の原因候補（高確度）:
- `workspaces/server/src/ssr.tsx` で `createStaticRouter` + `renderToString(...)` を削除。
- 返却HTMLを最小化し、`window.__staticRouterHydrationData` のみ埋める構造へ変更。
- その結果、lazy route の loader 解決前に描画が進み、`invariant(...)` 前提ページが成立しない可能性が高い。
  - `workspaces/client/src/pages/episode/components/EpisodePage.tsx`
  - `workspaces/client/src/pages/series/components/SeriesPage.tsx`
  - `workspaces/client/src/pages/program/components/ProgramPage.tsx`

採点影響:
- ランディング（`/episodes/*`, `/programs/*`, `/series/*`）の大幅失点。
- 回遊系ユーザーフローも遷移先が成立せず失点。

修正方針:
- SSR経路の `loaderData` 復旧を最優先（まずここを直さないと他改善が点数化しにくい）。

### 10-2. P0（最優先）: 動画再生スコアが20秒タイムアウト

観測（scoring-tool と同等の `playing` mark 待ち）:
- `/episodes/15792f69-bfa6-4c69-bb65-a674167e6d02`: `timeout20s`（playing mark 未発火）
- `/programs/8840e380-d456-456b-84ff-3a2c7326907c`（13:00固定Date mock）: `timeout20s`（playing mark 未発火）

補足:
- `.m3u8` / `.ts` 配信は 200 のため「ファイル欠損」ではない。
- 10-1 の画面成立不全（video要素未描画）と整合するため、主因は動画変換より前段の描画/ルーティング破綻と判断。

採点影響:
- 動画再生2項目（100点）をほぼ落とす可能性が高い。

修正方針:
- 10-1 修正後に `playing` 発火を再計測し、再生系の個別問題切り分けを実施。

### 10-3. P1（高優先）: ロゴURL拡張子不整合（404）

観測:
- DB（`workspaces/server/database.sqlite`）の `channel.logoUrl` は `*.svg`。
- `public/logos/*.svg` は削除済みで `*.webp` のみ。
- `curl -I http://127.0.0.1:8000/public/logos/news.svg` は `404`。

差分上の状況:
- `workspaces/server/tools/seed.ts` は `.webp` 出力へ変更済み。
- ただし採点は `database.sqlite` 初期値依存のため、seed変更だけでは既存DB不整合を解消できない。
- `workspaces/client/src/pages/timetable/components/ChannelTitle.tsx` の `.svg -> .webp` 置換は局所回避で、他経路の直利用リスクは残る。

採点影響:
- 直接0点化より、404増加・描画崩れ・ノイズ要因として悪影響。

修正方針:
- DB初期値または配信資産のどちらかを一貫させ、URL不整合を解消。

### 10-4. P2（中優先）: API応答の正規化による副作用リスク

差分:
- `workspaces/server/src/api.ts` で `trimText(...)` を導入し description を短縮。
- `/recommended/:referenceId` で `series.description=''`, `series.episodes=[]` などの正規化を実施。

リスク:
- 画面は概ね表示可能でも、固定文言/データ前提箇所で表示差分が出る可能性。
- 追加の map/copy によりAPI応答時間悪化の可能性。

現時点判断:
- 今回の大幅失点の主因は 10-1/10-2 で、これは二次要因。

修正方針:
- 採点必須フィールドを維持した最小正規化に限定し、不要な加工は削減。

### 10-5. P3（低優先）: 「動画変換ミス」可能性の再評価

確認済み:
- `.ts` セグメントは sync byte/packet 構造上は破綻していない（簡易チェック）。
- `/streams/episode/.../playlist.m3u8` と `/streams/channel/.../playlist.m3u8` は 200 で返る。

未確認:
- `ffprobe` 不在のため codec/GOP/キーフレーム配置は未検証。

現時点結論:
- 先に 10-1/10-2 を直し、なお再生不良が残る場合のみ詳細な動画検査へ進む。
