# 変更内容まとめ（日本語）

最終更新日: 2026-02-14
対象: 本ブランチで実施した一連の最適化・構成変更

## 1. 全体サマリ

- 変更ファイル数: 508
  - 変更: 390
  - 追加: 66
  - 削除: 52
- 差分行数（テキスト）: +20,237 / -798
- 主な変更領域:
  - `workspaces/server`: 324ファイル
  - `public`: 104ファイル
  - `workspaces/client`: 72ファイル
  - `docs`: 2ファイル

### 容量面の結果（HEAD比較の定量）

- 画像系（`public/images` + `public/animations` + 番組表説明画像）
  - 変更前: 47,787,678 bytes
  - 変更後: 3,336,384 bytes
  - 削減率: **93.02%**
- ロゴ系（`public/logos` + `public/arema`）
  - 変更前: 36,241,231 bytes
  - 変更後: 15,454 bytes
  - 削減率: **99.96%**
- ストリームチャンク（`workspaces/server/streams`）
  - 変更前: 196,150,364 bytes
  - 変更後: 76,269,532 bytes
  - 削減率: **61.12%**

## 2. 目的

この変更群の主目的は以下です。

1. 初期表示・遷移・再生開始までの待ち時間短縮
2. サーバーCPU負荷とI/O負荷の削減
3. 転送量の削減（特に画像・ストリーム配信）
4. 採点シナリオでのタイムアウト/重さ起因失点の回避
5. 開発・デプロイ再現性の向上

## 3. 変更内容（領域別）

## 3-1. ドキュメント・運用

### 対象
- `.nvmrc`（追加）
- `docs/development.md`
- `docs/deployment.md`
- `plan.md`（追加）
- `research.md`（追加）
- `light-house-test-first.json`（追加）

### 変更内容
- Node.jsバージョン固定（22.14.0）
- 開発時のNode解決差異（`which -a node`）の注意点を追記
- Railway向けデプロイ手順と運用注意点を明文化
- 採点ロジックの調査結果、改善計画、計測ベースラインをリポジトリ内に記録

### 理由
- 環境差異で同じコードが再現不能になるリスクを下げるため
- スコア改善の根拠をチームで共有・検証可能にするため

### 結果
- セットアップ時のブレを低減
- 変更意図・前提・検証根拠の追跡性を確保

## 3-2. 静的アセット最適化（画像・ロゴ・robots）

### 対象
- `public/images/*.jpeg -> *.webp`（37ペア）
- `public/logos/*.svg -> *.webp`（12ペア）
- `public/arema.svg -> public/arema.webp`
- `public/animations/001.gif -> 001.webp`
- `public/robots.txt.br`, `public/robots.txt.gz`（追加）
- `workspaces/client/assets/timetable/feature-explain.png -> .webp`
- `workspaces/test/src/full-page.test.ts`（VRTマスク調整）

### 変更内容
- 画像フォーマットをWebPへ移行
- robotsに事前圧縮ファイルを追加
- VRTマスク対象を拡張子依存からパス依存へ変更

### 理由
- ページ重量削減とデコード負荷低減
- 事前圧縮配信の活用
- 画像拡張子変更後もテスト安定性を維持

### 結果
- 画像転送量を大幅削減（上記定量結果参照）
- 404/一覧/番組表など画像比率の高い画面で体感改善が見込める

## 3-3. クライアント基盤・依存関係・ビルド

### 対象
- `workspaces/client/package.json`
- `pnpm-lock.yaml`
- `workspaces/client/webpack.config.mjs`
- `workspaces/client/src/setups/unocss.ts`
- `workspaces/client/src/assets/iconify/*`（必要最小JSONを追加）
- `workspaces/client/src/types.d.ts`
- `workspaces/client/src/utils/debounce.ts`（追加）
- `workspaces/client/src/app/createRoutes.tsx`
- `workspaces/client/src/app/createStore.ts`

### 変更内容
- 不要依存（遅延・汎用ユーティリティ等）を整理
- webpackを本番モード寄りに調整、source map抑制
- アイコンセットをローカル最小データに寄せる
- ルート遷移の人工遅延を撤去
- store初期化処理を簡素化

### 理由
- バンドル/初期実行コストの削減
- 依存由来の読み込み遅延と複雑性を減らすため

### 結果
- ルート遷移待ち時間と初期処理コストを圧縮
- 依存管理の保守性向上

## 3-4. クライアント共通UI/フック最適化

### 対象（主なもの）
- `features/layout/*`
- `features/recommended/*`
- `features/auth/hooks/*`
- `features/requests/schedulePlugin.ts`
- `features/timetable/hooks/useTimetable.ts`
- `features/timetable/stores/createTimetableStoreSlice.ts`
- `main.tsx`, `Document.tsx`

### 変更内容
- ポーリング中心の実装をイベント駆動へ置換（`ResizeObserver`, pointer event）
- store selector粒度の見直し（全体取得を削減）
- `schedulePlugin` の人工待機を撤廃
- スクロールスナップ・カルーセルの計算を軽量化
- 画像要素に `decoding/loading/fetchPriority` を付与

### 理由
- 不要な再レンダリング・再計算・常時タイマーを減らすため

### 結果
- メインスレッド負荷とUIジャンクの低減
- 応答性改善

## 3-5. ページ単位の改善（home/episode/program/series/not_found）

### 対象
- `pages/home/components/HomePage.tsx`
- `pages/episode/*`
- `pages/program/*`
- `pages/series/components/SeriesPage.tsx`
- `pages/not_found/components/NotFoundPage.tsx`

### 変更内容
- プレイヤー関連の遅延読込導入（必要時ロード）
- 再生ページのフォールバック表示整理
- 一部表示件数の上限化
- 404ページで重いGIFを撤去しWebP化

### 理由
- 初期描画に不要な処理・アセットを遅延化して、初期到達を速めるため

### 結果
- 初期表示の重さを緩和
- 再生導線の待ち時間短縮が見込める

## 3-6. 番組表ページ最適化

### 対象
- `pages/timetable/components/*`
- `pages/timetable/hooks/*`
- `pages/timetable/stores/*`

### 変更内容
- `ProgramList` に `content-visibility` / `contain-intrinsic-size` を導入
- 表示時間帯を絞った描画制御を導入
- ダイアログ表示時のみ詳細取得
- 現在時刻更新を高頻度から1分周期へ変更
- 新機能ダイアログを軽量オーバーレイ実装へ整理

### 理由
- DOM量・再計算・ネットワークアクセスを抑え、番組表の重さを下げるため

### 結果
- 番組表スクロールや遷移時の負荷が低減
- ただし時刻境界の反映粒度は粗くなる（1分単位）

## 3-7. サーバー（API/SSR/配信/ストリーム）

### 対象
- `workspaces/server/src/index.ts`
- `workspaces/server/src/ssr.tsx`
- `workspaces/server/src/api.ts`
- `workspaces/server/src/streams.tsx`
- `workspaces/server/package.json`
- `workspaces/server/loaders/png.cjs`
- `workspaces/server/tools/precompress_assets.mjs`（追加）
- `workspaces/server/tools/seed.ts`

### 変更内容
- API:
  - テキスト説明のトリミング
  - 推薦モジュール（entrance）の取得件数を制限
  - ネスト情報を軽量化
- SSR/静的配信:
  - 返却HTMLを簡素化
  - pre-compressed配信対応
  - 拡張子別のキャッシュ方針適用
  - `jpeg`リクエスト時の`webp`フォールバック配信
- ヘッダ方針:
  - `no-store` を API のみに限定
- ストリーム:
  - プレイリスト生成でN+1クエリを排除
  - ループ内の高コストランダム処理を撤去
  - playlistレスポンスのキャッシュ方針を明示
- 起動前処理:
  - 事前圧縮（br/gz）を起動コマンドへ組み込み
- loader/seed:
  - `.webp` 取り扱いとseedロゴURLをWebPへ揃える

### 理由
- サーバー側の計算・I/O・転送量を削減し、初回表示と再生開始を安定化するため

### 結果
- API/SSR/playlist の処理コストを削減
- 静的アセット配信効率を改善

## 3-8. ストリームチャンク群の軽量化

### 対象
- `workspaces/server/streams/caminandes2/*`（73 files）
- `workspaces/server/streams/dailydweebs/*`（30 files）
- `workspaces/server/streams/glasshalf/*`（96 files）
- `workspaces/server/streams/wing-it/*`（117 files）

### 変更内容
- すべてのTSチャンクデータを軽量化

### 理由
- セグメント配信の転送量削減と配信効率向上

### 結果
- ストリームファイル群合計で 61.12% 削減

## 4. リスクと確認ポイント

1. APIレスポンス軽量化の互換性
- 長文や深いネストを前提にしたUIがある場合に表示差分の可能性

2. 番組表の描画省略ロジック
- 表示窓外の要素が遅延描画となるため、境界条件で見え方差分の可能性

3. 現在時刻更新周期（1分）
- 放送前/中/後の切替反映が秒単位ではなくなる

4. キャッシュ方針変更
- 開発/検証時のキャッシュ残存に注意

5. 起動前事前圧縮
- コールドスタート時間と書き込み権限の確認が必要

## 5. 変更コミット一覧（今回の分割）

- `5d0728c` ドキュメントと計測結果を更新
- `d925c4f` 静的アセットをWebP中心に置き換え
- `215bf72` クライアントの依存関係とビルド設定を整理
- `77ba9e2` 共通UIとフックのパフォーマンスを最適化
- `8122de4` ページ単位で再生導線と描画負荷を改善
- `dc9f587` 番組表ページの描画戦略と状態更新を見直し
- `550b9d5` サーバー起動と静的配信の最適化を実施
- `0d2d82d` APIレスポンスを軽量化し推薦取得を最適化
- `5643ae1` ストリームプレイリスト生成の負荷を削減
- `219d35b` ストリームチャンク(caminandes2)を軽量化
- `e8b59b7` ストリームチャンク(dailydweebs)を軽量化
- `4b74eb5` ストリームチャンク(glasshalf)を軽量化
- `10bb0ea` ストリームチャンク(wing-it)を軽量化

## 6. 補足

- 以前 `.gitignore` に置いていたレポートは削除済み。
- 本資料を正本として `docs/change-summary-ja.md` に集約。
