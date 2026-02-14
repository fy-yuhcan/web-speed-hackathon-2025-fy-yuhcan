# plan.md

本ファイルを実装セッションの唯一の真実（Single Source of Truth）とする。  
根拠は `research.md` と現行コードベース。

## 0. ゴール
- 目的: レギュレーションを維持したまま、採点スコアを最短で引き上げる。
- 制約:
  - 自動採点の固定ID/固定文言/role依存を壊さない。
  - `POST /api/initialize` の挙動を壊さない。
  - VRT/手動テスト観点で機能落ちを起こさない。

## 0-1. 最新採点結果（2026-02-14）
- 合計: `94.75 / 1200.00`
- ランディング9項目の合計: `94.75 / 900.00`
- 事実:
  - ランディング合計 `< 200` のため、ユーザーフロー4項目 + 再生開始2項目がすべて「計測できません（アプリが重いためスキップ）」になった。
  - 現時点の最優先は「まずランディング合計を 200 以上に戻す」こと。

| 項目 | Score |
|---|---:|
| ホームを開く | 24.25 |
| エピソード視聴（無料作品）を開く | 24.00 |
| エピソード視聴（プレミアム作品）を開く | 4.50 |
| 番組表を開く | 25.00 |
| 番組視聴（放送前）を開く | 6.25 |
| 番組視聴（放送中）を開く | 0.50 |
| 番組視聴（放送後）を開く | 5.50 |
| シリーズを開く | 0.75 |
| 404 ページを開く | 4.00 |

## 1. 変更ファイル一覧（予定）と変更点要約

### Must（採点に直結）
1. `workspaces/client/src/features/requests/schedulePlugin.ts`
   - APIリクエストの人工1秒遅延を撤廃（少なくとも本番/採点経路では無効化）。
2. `workspaces/client/src/app/createRoutes.tsx`
   - `p-min-delay(..., 1000)` を撤廃し、ルート遷移の最低遅延を除去。
3. `workspaces/server/src/ssr.tsx`
   - 全画像列挙 + 全 preload の毎リクエスト出力をやめる（必要最小限へ）。
4. `workspaces/server/src/streams.tsx`
   - `/streams/channel/:channelId/playlist.m3u8` の `randomBytes(3MB)` 連発を削減/軽量化。
5. `workspaces/server/src/index.ts`
   - 一律 `cache-control: no-store` を見直し（少なくとも静的配信へ不必要な no-store を外す）。
6. `workspaces/server/src/streams.tsx`
   - `/streams/channel/:channelId/playlist.m3u8` の N+1 クエリを解消（ループ内 `findFirst` の撤廃）。
7. `workspaces/server/src/index.ts` / `workspaces/server/src/ssr.tsx`
   - 静的アセットを gzip/brotli で配信できる構成へ（`@fastify/compress` または pre-compressed 配信）。
8. `workspaces/server/src/streams.tsx`
   - `*.ts` と `*.m3u8` の `cache-control` 方針を分離（セグメントとプレイリストの更新特性に合わせる）。

### 次点（効く可能性が高い）
1. `workspaces/client/src/features/layout/hooks/useSubscribePointer.ts`
   - `setImmediate` 無限ループを廃止し、pointermove イベント駆動へ変更。
2. `workspaces/client/src/features/layout/components/Hoverable.tsx`
   - pointer グローバル購読 + `getBoundingClientRect()` 常時計測を撤廃（CSS `:hover` 優先）。
3. `workspaces/client/src/features/recommended/hooks/useScrollSnap.ts`
   - 間隔未指定 `setInterval`（実質 0ms）を廃止し、scroll/scrollend 起点へ変更。
4. `workspaces/client/src/features/recommended/hooks/useCarouselItemWidth.ts`
   - 250msポーリングを `ResizeObserver` ベースに置換。
5. `workspaces/client/src/pages/timetable/components/Program.tsx`
   - カード単位タイマーを削減（時刻更新とDOM計測の2系統ポーリング解消）。
6. `workspaces/client/src/pages/timetable/hooks/useCurrentUnixtimeMs.ts`
   - ページ単位1本の時刻更新に集約し、番組数に比例した interval 増殖を止める。
7. `workspaces/client/src/pages/timetable/components/ProgramDetailDialog.tsx`
   - ダイアログ open 時のみ episode fetch を実行（閉状態の不要 fetch を停止）。
8. `workspaces/client/src/features/timetable/hooks/useTimetable.ts`
   - 毎レンダリング全件 group/sort をやめ、selector粒度改善 + メモ化。
9. `workspaces/client/src/pages/episode/hooks/useSeekThumbnail.ts`
   - FFmpeg処理の発火条件を厳格化。中期的にはサーバー生成サムネイルへ移行。
10. `workspaces/client/src/features/player/logics/create_player.ts`
   - player type ごとの dynamic import に分割し、未使用プレイヤーの同時ロードを防止。
11. `workspaces/client/src/features/timetable/hooks/useTimetable.ts`
   - 毎回全件再構築（`Object.values` + 二重ループ + sort）を抑制する。
12. `workspaces/client/src/features/timetable/stores/createTimetableStoreSlice.ts`
   - `draft.programs = {}` の全件リセットを差分更新へ置換する。
13. `workspaces/client/src/features/recommended/hooks/useRecommended.ts`
   - `recommendedModules` 全体依存による再計算を削減する。
14. `workspaces/client/src/features/series/components/SeriesEpisodeList.tsx`
   - `[...episodes].sort(...)` の毎レンダリング実行をメモ化する。

### 余裕があれば
1. `workspaces/client/src/features/player/logics/create_player.ts`
   - 再生開始時間（join time）に効く初期化順序・buffer設定の微調整。
2. `workspaces/client/src/pages/program/components/ProgramPage.tsx`
   - 放送前/中/後分岐を維持したまま不要再計算を削減。
3. `workspaces/client/src/pages/timetable/components/Program.tsx`
   - 250ms interval/DOM計測の削減（画像表示判定の軽量化）。

## 2. 実装手順（最新）

### フェーズA: 完了済みの基礎改善を固定
1. `schedulePlugin` と `createRoutes` の人工遅延除去を維持。
2. SSR HTML肥大化（全画像 preload）削減を維持。
3. stream playlist生成の高コスト処理削減を維持。
4. キャッシュヘッダの整理（API のみ no-store）を維持。
5. 上記を壊さないことを前提に次フェーズへ進む。

### フェーズB: ランディング200点の復帰（最優先）
1. 404 系ノイズを先に潰す（`/public/images/*.jpeg?version=...` の配信不整合を解消）。
2. 低スコア4ページ（シリーズ、番組視聴[放送中/前/後]、404）を優先してボトルネック除去。
3. 重量ポーリング系（pointer/timetable/recommended/layout）を段階的にイベント駆動化。
4. 変更ごとに採点を再実行し、ランディング合計の増分を記録。

### フェーズC: ランディング解除後（>200）に着手
1. スキップ解除されたユーザーフロー4項目と再生2項目を順次最適化。
2. `SeekThumbnail` と `create_player` の重量処理を遅延化・分割。
3. 体感改善より「採点値に寄与するもの」だけ採用。

### フェーズD: 余裕があれば
1. Player初期化・program描画・timetable描画の微最適化。
2. 体感改善より「採点値に寄与するもの」だけ採用。

## 3. 受け入れ条件との1:1対応

| AC ID | 受け入れ条件 | どこで満たすか（実装/維持箇所） |
|---|---|---|
| AC-01 | `POST /api/initialize` が `200/204` | `workspaces/server/src/api.ts` の `/initialize` を変更しない。回帰はcurlで確認。 |
| AC-02 | initializeでDBが初期状態に戻る | `workspaces/server/src/drizzle/database.ts` と `workspaces/server/database.sqlite` は互換維持。 |
| AC-03 | ランディング9URLが120s以内に安定遷移 | Mustの遅延除去: `schedulePlugin.ts`, `createRoutes.tsx`, `ssr.tsx`。 |
| AC-04 | ランディング200点未満時の打ち切り回避 | AC-03対応 + stream/CPU改善（`streams.tsx`）で底上げ。 |
| AC-05 | 認証フロー（文言/操作）成立 | `features/auth/components/*.tsx`, `Layout.tsx` の文言とroleを維持。 |
| AC-06 | 番組表スライダー操作成立 | `pages/timetable/components/Gutter.tsx` の `role="slider"` を維持。 |
| AC-07 | ホーム→シリーズ→エピソード固定導線成立 | 固定タイトル/リンクを壊さない。データID・表示文言を維持。 |
| AC-08 | 番組表→モーダル→番組→エピソード導線成立 | `NewTimetableFeatureDialog.tsx`「試してみる」、`ProgramDetailDialog.tsx`「番組をみる」を維持。 |
| AC-09 | エピソード再生20秒以内 | `create_player.ts`, `streams.tsx`, `schedulePlugin.ts` の改善で再生開始を短縮。 |
| AC-10 | 番組再生20秒以内（mock 13:00） | `ProgramPage.tsx` の放送中条件維持 + `streams.tsx` 軽量化で応答短縮。 |
| AC-11 | APIレスポンス型互換 | `workspaces/schema/src/openapi/schema.ts` に整合する形を維持。 |
| AC-12 | 並び順（sort/order）互換 | `workspaces/server/src/api.ts` の `orderBy` 方針を維持。 |
| AC-13 | JST/時刻境界の互換 | `workspaces/*/setups/luxon.ts`, `schema/database/schema.ts` を前提維持。 |
| AC-14 | 機能落ち・見た目劣化なし | `workspaces/test`（VRT/E2E）で回帰確認。 |

## 4. 検証手順

## 4-1. 最速スモーク（起動/最低限）
1. 起動
```bash
cd /Users/fujitayuuki/proj/cyber/web-speed-hackathon-2025
pnpm run start
```
2. initialize疎通
```bash
curl -i -X POST http://localhost:8000/api/initialize
```
期待:
- HTTP `200`（または204）
- bodyは `{}`（現行）
3. 主要ページ疎通（固定ルート）
```bash
curl -I http://localhost:8000/
curl -I http://localhost:8000/timetable
curl -I http://localhost:8000/programs/8840e380-d456-456b-84ff-3a2c7326907c
curl -I http://localhost:8000/episodes/15792f69-bfa6-4c69-bb65-a674167e6d02
```
4. 最短の採点確認（任意）
```bash
cd /Users/fujitayuuki/proj/cyber/web-speed-hackathon-2025-scoring-tool
pnpm start --applicationUrl http://localhost:8000
```

## 4-2. 最終フル（test → typecheck → build）
1. test
```bash
cd /Users/fujitayuuki/proj/cyber/web-speed-hackathon-2025
pnpm run test
```
2. typecheck
```bash
pnpm --filter "@wsh-2025/schema" exec tsc --noEmit
pnpm --filter "@wsh-2025/client" exec tsc --noEmit
pnpm --filter "@wsh-2025/server" exec tsc --noEmit
pnpm --filter "@wsh-2025/test" exec tsc --noEmit
```
3. build
```bash
pnpm run build
```
4. 最終スコア確認
```bash
cd /Users/fujitayuuki/proj/cyber/web-speed-hackathon-2025-scoring-tool
pnpm start --applicationUrl http://localhost:8000
```

## 4-3. APIの具体的curl例（入力と期待出力）

1. 初期化
```bash
curl -i -X POST http://localhost:8000/api/initialize
```
期待:
- `200 OK`
- `{}`

2. チャンネル取得（複数ID）
```bash
curl -sG \
  --data-urlencode "channelIds=815bf011-f294-4b0d-9f87-6fff8a74e48d,72d0c211-67cf-48c5-8103-6111ea00d109" \
  http://localhost:8000/api/channels
```
期待:
- JSON配列
- 各要素に `id,name,logoUrl`

3. 番組表取得（JST範囲）
```bash
curl -sG \
  --data-urlencode "since=2026-02-14T00:00:00.000+09:00" \
  --data-urlencode "until=2026-02-14T23:59:59.999+09:00" \
  http://localhost:8000/api/timetable
```
期待:
- JSON配列
- `startAt` 昇順
- 各要素に `id,title,startAt,endAt,channelId,episodeId`

4. 認証シーケンス（cookie付き）
```bash
# signUp
curl -i -c /tmp/wsh.cookie -H "content-type: application/json" \
  -d '{"email":"plan-check@example.test","password":"test"}' \
  http://localhost:8000/api/signUp

# users/me (signed in)
curl -i -b /tmp/wsh.cookie http://localhost:8000/api/users/me

# signOut
curl -i -b /tmp/wsh.cookie -X POST http://localhost:8000/api/signOut

# users/me (signed out)
curl -i -b /tmp/wsh.cookie http://localhost:8000/api/users/me
```
期待:
- signUp: `200`
- users/me(直後): `200`
- signOut: `200`
- users/me(後): `401`

## 5. 不明点の仮定（採用デフォルト）と確認方法

1. 仮定: 公開 `web-speed-hackathon-2025-scoring-tool` が採点仕様そのもの
- デフォルト: セレクタ文言・固定ID・flow順序を維持して最適化する。
- 確認方法: scoring-tool実行結果と手元E2E/VRTを常に同時確認。

2. 仮定: 固定データ（`database.sqlite`）は変更しないのが安全
- デフォルト: ID/タイトルを変えるseed再生成は行わない。
- 確認方法: `POST /api/initialize` 後に固定ID URLが到達可能かをcurlと採点で確認。

3. 仮定: Node.js 22系での計測が正
- デフォルト: Node 22.14+ を前提に実行する。
- 確認方法: `node -v` を固定し、スコア差を環境差として切り分ける。

4. 仮定: `/404` のHTTPステータスは採点上クリティカルではない（ページ描画優先）
- デフォルト: 現行挙動を維持。
- 確認方法: `curl -I /404` と scoring-tool の `calculate_not_found_page` 成否を確認。

5. 仮定: 認証 `signIn` のレスポンスは現行のまま互換維持で良い
- デフォルト: 返却shapeを安易に変更しない。
- 確認方法: `curl` + フロント認証E2Eで200/401挙動とUI反映を確認。

## 6. 実装時の禁止事項
- 固定文言（`ログイン`, `ログアウト`, `試してみる`, `番組をみる`）を変更しない。
- `role="slider"` を消さない。
- `POST /api/initialize` の契約を変えない。
- `database.sqlite` の固定ID/固定タイトルを壊す変更をしない。

## 7. チェック可能TODO（実装順）

時間が足りない場合は **Must のみ** 実施する。  
Must は「採点最大化への寄与が大きい順」に並べている。

### Must（採点に直結）
- [x] M1: API人工遅延の撤廃  
  対象: `workspaces/client/src/features/requests/schedulePlugin.ts`  
  完了条件: 採点経路で 1000ms 遅延が入らない。
- [x] M2: ルート遷移の最低1秒遅延を撤廃  
  対象: `workspaces/client/src/app/createRoutes.tsx`  
  完了条件: `p-min-delay(..., 1000)` が除去され、遷移開始が即時。
- [x] M3: 一律 `no-store` の見直し（静的再利用を許可）  
  対象: `workspaces/server/src/index.ts`  
  完了条件: 少なくとも静的アセット/SSRで不要な `no-store` が外れる。
- [x] M4: SSRでの全画像 preload 出力を削減  
  対象: `workspaces/server/src/ssr.tsx`  
  完了条件: 毎リクエストで全画像を列挙・preloadしない。
- [x] M5: playlist生成の高コスト乱数処理を軽量化  
  対象: `workspaces/server/src/streams.tsx`  
  完了条件: `randomBytes(3 * 1024 * 1024)` 相当の重処理が除去/大幅軽量化。
- [x] M6: Must後の最短採点を実行して差分を記録  
  対象: 実行手順（`web-speed-hackathon-2025-scoring-tool`）  
  完了条件: Before/After の総合スコアを記録。  
  結果: `94.75 / 1200.00`（ランディング `< 200` で後段6項目スキップ）。
- [ ] M7: `/public/images/*.jpeg?version=...` の 404 を解消  
  対象: `workspaces/server/src/ssr.tsx`（静的配信と画像フォールバックのルーティング順/経路）  
  完了条件: 採点時に `errors-in-console` の 404 が画像由来で発生しない。
- [ ] M8: ランディング低スコア4ページのボトルネック優先解消  
  対象: `SeriesPage`, `ProgramPage`, `NotFoundPage` と関連データフェッチ  
  完了条件: 各ページのスコアが最低 `15+` を安定して超える。
- [ ] M9: ランディング合計を `200+` に到達させ、後段6項目の計測スキップを解除  
  対象: スコアリング実行結果  
  完了条件: 「計測できません（アプリが重いためスキップ）」が解消される。
- [x] M10: `/streams/channel/:channelId/playlist.m3u8` の N+1 を解消  
  対象: `workspaces/server/src/streams.tsx`  
  完了条件: ループ内 `findFirst` を廃止し、playlist生成時の DB クエリ回数を定数化する。  
  実施: `findMany` 一括取得 + ループ内メモリ解決へ変更済み。
- [x] M11: 静的アセットの gzip/brotli 配信を有効化  
  対象: `workspaces/server/src/index.ts`, `workspaces/server/src/ssr.tsx`  
  完了条件: text系アセットで `content-encoding` が付与され、または pre-compressed ファイルが優先配信される。  
  実施: `preCompressed: true` + `precompress_assets.mjs` を `start/heroku-start` に導入済み。
- [x] M12: `/streams` の `cache-control` を用途別に分離  
  対象: `workspaces/server/src/streams.tsx`  
  完了条件: `*.ts` と `*.m3u8` で意図したキャッシュ方針が設定される。  
  実施: `*.ts` は long-cache immutable、`playlist.m3u8` は no-cache 設定済み。
- [x] M13: SPA非対応の `a` タグ遷移の棚卸し  
  対象: `workspaces/client/src`, `workspaces/server/src`  
  完了条件: プレーン `<a>` の使用有無を確認し、結果を `research.md` に追記済み。

### Should（次点）
- [ ] S1: pointer 無限ループを廃止しイベント駆動化  
  対象: `workspaces/client/src/features/layout/hooks/useSubscribePointer.ts`  
  完了条件: `setImmediate` 連続実行が消える。
- [ ] S2: `Hoverable` のグローバルpointer依存を解消  
  対象: `workspaces/client/src/features/layout/components/Hoverable.tsx`  
  完了条件: `getBoundingClientRect()` の常時計測が発生しない。
- [ ] S3: 番組表の時刻更新タイマーをページ単位1本へ集約  
  対象: `workspaces/client/src/pages/timetable/hooks/useCurrentUnixtimeMs.ts`, `workspaces/client/src/pages/timetable/components/Program.tsx`  
  完了条件: 番組数に比例した interval 増殖がない。
- [ ] S4: 番組カードの画像表示判定ポーリングを除去  
  対象: `workspaces/client/src/pages/timetable/components/Program.tsx`  
  完了条件: 250ms DOM計測ループがない。
- [ ] S5: 閉じたダイアログの不要fetchを停止  
  対象: `workspaces/client/src/pages/timetable/components/ProgramDetailDialog.tsx`, `workspaces/client/src/pages/timetable/hooks/useEpisode.ts`  
  完了条件: ダイアログ未表示時に episode API が発火しない。
- [ ] S6: `useTimetable` の全件再構築を抑制  
  対象: `workspaces/client/src/features/timetable/hooks/useTimetable.ts`  
  完了条件: 無関係更新で group/sort が再実行されない。
- [ ] S7: ストア全体購読 (`useStore((s)=>s)`) の段階的廃止  
  対象: `workspaces/client/src/**/hooks/*.ts*`（24箇所）  
  完了条件: selector を最小単位化し、無関係再レンダリングを削減。
- [ ] S8: カルーセル snap の常時ループを廃止  
  対象: `workspaces/client/src/features/recommended/hooks/useScrollSnap.ts`  
  完了条件: 実質0msポーリングが消える。
- [ ] S9: 幅計算/比率計算のポーリングを `ResizeObserver` へ  
  対象: `workspaces/client/src/features/recommended/hooks/useCarouselItemWidth.ts`, `workspaces/client/src/features/layout/components/AspectRatio.tsx`  
  完了条件: 250ms/1000ms 間隔更新が不要になる。
- [ ] S10: シークサムネイル重処理の発火条件を最小化  
  対象: `workspaces/client/src/pages/episode/hooks/useSeekThumbnail.ts`  
  完了条件: 非必要時に FFmpeg 処理が走らない。
- [x] S11: `useTimetable` の全件再構築を抑制  
  対象: `workspaces/client/src/features/timetable/hooks/useTimetable.ts`  
  完了条件: `Object.values + 二重ループ + sort` の全件再計算を差分最小化する。  
  実施: 二重ループを除去し、1回走査で channel grouping する実装へ変更済み。
- [x] S12: 番組ストア更新を全件リセットから差分更新へ変更  
  対象: `workspaces/client/src/features/timetable/stores/createTimetableStoreSlice.ts`  
  完了条件: `draft.programs = {}` を避け、更新対象のみを書き換える。  
  実施: `immer produce` を除去し、軽量な map 置換へ変更済み。
- [x] S13: `useRecommended` の再計算粒度を細分化  
  対象: `workspaces/client/src/features/recommended/hooks/useRecommended.ts`  
  完了条件: `recommendedModules` 全体依存を減らし、無関係更新で再計算しない。  
  実施: selector + `shallow` 比較で不要再レンダリングを抑制。
- [x] S14: `SeriesEpisodeList` の毎レンダリング sort をメモ化  
  対象: `workspaces/client/src/features/series/components/SeriesEpisodeList.tsx`  
  完了条件: `episodes` 変更時のみ sort 実行となる。  
  実施: `useMemo` 化済み。

### Could（余裕があれば）
- [ ] C1: プレイヤー実装の分割ロード（player type別 dynamic import）  
  対象: `workspaces/client/src/features/player/logics/create_player.ts`  
  完了条件: 未使用プレイヤー実装を初期評価しない。
- [ ] C2: 番組ページの再計算・タイマー微調整  
  対象: `workspaces/client/src/pages/program/components/ProgramPage.tsx`  
  完了条件: 放送前/中/後挙動を維持しつつ不要更新を削減。
- [ ] C3: `SeekThumbnail` のサーバー生成化（中期）  
  対象: `workspaces/client/src/pages/episode/hooks/useSeekThumbnail.ts`, `workspaces/server/src`（新規API想定）  
  完了条件: ブラウザ FFmpeg 実行を撤去して同等UXを維持。

### 時間切れ時の実行境界
- [ ] Gate-1: Must完了時点で提出可能品質  
  条件: M1〜M6 がすべて完了、`POST /api/initialize` と主要導線が生存。
- [ ] Gate-2: Shouldを1つでも入れる場合の最低条件  
  条件: 各S項目ごとにスモーク確認し、悪化時は即ロールバック。
