<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Storyou プロジェクトの約束事

ストーリー型のAI英会話アプリ。「壊れない大枠」を最優先にした層分離が肝。**変更前に該当の設計章を読むこと**：[docs/02-design.md](docs/02-design.md)（全体像）と [docs/01-requirements.md](docs/01-requirements.md)（要件）。

## アーキテクチャ（1フォルダ＝1層）
- `content/` … データ（ストーリー・登場人物・章）。アプリの「中身」。型は `content/schema.ts` が単一の真実。
- `engine/` … 再生の状態機械（`storyEngine.ts` は純粋ロジック、`useStoryEngine.ts` はReact＋アダプタの橋渡し）。
- `adapters/` … 録音/音声合成/採点の窓口（`interfaces.ts`）と実装。使う実装は `adapters/index.ts` で配線。
- `app/` `components/` … UI。
- `config/scoring.ts` … 採点の閾値とA/B/C反応文。`lib/` … テキスト処理など。

## 変更のしかた（壊さないために）
- **ストーリー追加** → `content/stories/` にファイルを1つ作り、`content/index.ts` に登録。Engine/UIは触らない。
- **APIの差し替え**（音声認識・採点など）→ `adapters/` に実装を足し、`adapters/index.ts` の1行を変更。Engineは触らない。
- **採点の調整** → `config/scoring.ts`。
- コードを変えたら設計ドキュメント(`docs/`)も同期させること（文書と実物をズラさない）。

## コマンド
- 開発: `npm run dev`（http://localhost:3000、Chrome/Edge推奨）
- ビルド: `npm run build` ／ 型チェック: `npx tsc --noEmit`

## 現状
MVP。台本型でLLM不要。採点は一致率ベースの簡易版（本格的な発音評価＝Azureへの差し替えは将来）。
