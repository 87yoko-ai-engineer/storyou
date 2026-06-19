# 設計書（大枠） — Storyou

> **この文書の位置づけ**
> 「壊れない骨組み」をコードを書く前に文章で固める文書。要件（[01-requirements.md](01-requirements.md)）を「どう作るか」に翻訳する。
> 章ごとに作成し、確認しながら進める。
>
> - ステータス: v1.0（完成）
> - 最終更新: 2026-06-19
> - 前提：[01-requirements.md](01-requirements.md)

## 目次（作成状況）

| 章 | 内容 | 状況 |
|---|---|---|
| 1 | 全体アーキテクチャ（4層） | ✅ 本書で作成 |
| **2** | **データモデル（コンテンツの骨組み）** | ✅ 本書で作成 |
| 3 | ストーリー再生エンジン（状態機械） | ✅ 本書で作成 |
| 4 | アダプタ設計（ASR・音声合成・採点の差し込み口） | ✅ 本書で作成 |
| 5 | 採点とA/B/C判定の仕組み | ✅ 本書で作成 |
| 6 | フォルダ構成・技術スタック | ✅ 本書で作成 |
| 7 | 拡張マップ | ✅ 本書で作成 |

---

## 1. 全体アーキテクチャ（4層）

### ねらい
アプリを「役割の違う4つの層」に分け、**よく変わるもの**と**変わらないもの**を分離する。これが「壊れない大枠」の本体。

### 4つの層

| 層 | 役割 | 中身の例 | 性質 |
|---|---|---|---|
| **A. Content層**（データ） | アプリの中身そのもの | ストーリー・セリフ・登場人物・声・採点閾値・反応文 | **どんどん増える**（2章の型） |
| **B. Engine層**（ロジック） | ストーリーを順に再生し、録音→採点→分岐を回す中心 | 状態機械（3章） | **ほぼ固定** |
| **C. Adapter層**（差し込み口） | 外部機能を呼ぶ「窓口」 | 文字起こし(ASR)・音声合成(TTS)・採点(Scorer)（4章） | **中身は可変・窓口の形は固定** |
| **D. UI層**（画面） | 見た目・操作 | 画面・録音ボタン・キャラ表示・進行表示 | **プラットフォーム依存**（ここだけWeb/モバイルで変わる） |

### 依存の向き（最重要ルール）
「依存」は**内側（安定したもの）へ向ける**。外側（変わりやすいもの）が内側に依存し、その逆はしない。

```
   D. UI層  ──▶  B. Engine層  ──▶  C. Adapter層（窓口の形＝インターフェース）
                      │                          ▲
                      │ データを読む              │ 実装を差し込む
                      ▼                          │
                A. Content層            ASR / TTS / Scorer の実装
                （ロジックを持たない）    （Whisper・Azure など具体的なAPI）
```

- **Engineは具体的なAPI（Whisper等）を知らない**。Adapterの"窓口の形"だけを知る → APIを変えてもEngineは無傷。
- **EngineはUIを知らない** → 画面をWebからモバイルに変えてもEngineは無傷。
- **Contentはただ読まれるだけ**でロジックを持たない → ストーリーを足してもロジックが壊れない。

### 「何を変えると、どこを触るか」早見表

| やりたいこと | 触る層 | 他の層への影響 |
|---|---|---|
| ストーリー追加 | A. Content（データ追加） | なし |
| 画面デザイン変更 | D. UI | なし |
| 文字起こしAPIを変更 | C. Adapter（実装差し替え） | なし |
| 採点を高度化（Azure等） | C. Adapter（Scorer実装） | なし |
| 会話の進め方を根本から変える | B. Engine | ここだけは慎重に（滅多に無い） |

### なぜ初心者・AIに優しいのか
- 「新しいストーリーはどこに足す？」の答えが**一意（Content層）**。迷わない。
- 私（AI）に頼むときも「Content層にA2を追加して」のように**範囲を限定して指示**でき、関係ない所を触らずに済む。
- 各層を**独立して確認・テスト**できる。

### MVPで実際に作る範囲（層ごと）
- **Content**：A1ストーリー1本のデータ
- **Engine**：台本を順に進める状態機械（3章）
- **Adapter**：ASR（簡易）・TTS・Scorer（一致率）の最小実装
- **UI**：1画面（セリフ表示・録音ボタン・反応表示・クリア表示）

---

## 2. データモデル（コンテンツの骨組み）

### この章のねらい
アプリの「中身（ストーリー）」を、**コードではなくデータ**として表すための型を決める。ここが正しければ、ストーリー追加＝**データを足すだけ**になり、骨組み（エンジン）を触らずに済む。

### 大前提：MVPのストーリーは「台本（スクリプト）」
MVPのストーリーは、セリフがあらかじめ決まっている**台本型**。

- AIキャラのセリフ＝**作者が書いた固定テキスト**を音声合成（TTS）で読み上げる。
- → **MVPの基本ループ（再生→録音→採点→分岐）にLLMは必須ではない**。必要なのは音声合成・文字起こし・採点。
- LLMを使った「自由会話モード」は将来の拡張。そのときも、ここで決める Character / Story の構造をそのまま再利用できる。

> これはMVPを小さく保つための重要な判断。「AIアプリなのにLLM要らないの？」と思うかもしれないが、台本型では不要で、その分シンプルに作れる。

### エンティティ（データの種類）

#### Chapter（章）
| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意のID（例 `"ch-business"`） |
| title | string | 章のタイトル |
| theme | string | テーマ（例 `"accounting"`） |
| order | number | 並び順 |

#### Story（ストーリー）
| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意のID |
| chapterId | string | どの章に属するか |
| title | string | ストーリーのタイトル |
| order | number | 章内の並び順 |
| cast | string[] | 登場人物（CharacterのID一覧） |
| turns | Turn[] | セリフの並び（順番付き） |

#### Character（登場人物）
| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意のID |
| name | string | 表示名（例 `"Sarah"`） |
| persona | string | 性格・役割の説明（音声合成や将来のLLMの参考） |
| voiceId | string | どの声を使うか（訛り対応はここを増やすだけ） |

#### Turn（セリフ／ターン）★中心
| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 一意のID |
| order | number | ストーリー内の順番 |
| type | `"ai"` \| `"user"` | AIが話す番か、ユーザーが録音する番か |
| speakerId | string | 話者のCharacter ID |
| text | string | 英語のセリフ（userターンでは"お手本"になる） |
| translation | string?（任意） | 和訳（将来の字幕用。MVPでも入れておける） |

#### Progress（進捗）
| フィールド | 型 | 説明 |
|---|---|---|
| userId | string | 誰の進捗か（MVPはログイン無しなので固定値でOK） |
| storyId | string | どのストーリーの進捗か |
| cleared | boolean | クリア済みか |
| bestTier | `"A"`\|`"B"`\|`"C"`?（任意） | 最高判定 |
| bestScore | number?（任意） | 最高スコア |

### 関係（つながり）
- Chapter 1 — 多 Story（`Story.chapterId` で親を指す）
- Story 1 — 多 Turn（`turns` に順番付きで持つ）
- Turn 多 — 1 Character（`speakerId` で話者を指す）
- Progress は user × Story の単位で記録

### A/B/C のリアクションはどこに置く？
キャラの反応（`A:"Good job!"` など）は、**各Turnに毎回書くのではなく、設定（config）として一箇所にまとめる**方針。

```json
{ "A": "Good job!", "B": "You're doing great!", "C": "Let's try a little harder." }
```

- 利点：セリフを増やしてもリアクション文を毎回書かずに済む（データが軽い）。
- 拡張：将来「このセリフだけ特別な反応にしたい」場合は、Turnに任意の `reactionsOverride` を足せばよい（後付け可能・骨組みは無傷）。
- 判定の閾値（何点でA/B/Cか）も config に置く → 「A/B/C/D に細分化」も設定変更だけで可能。

### 具体例：A1ストーリーをこの型で表すと
実際の確定セリフ（[01-requirements.md](01-requirements.md) の 6-α）をこの型に流し込むとこうなる（先頭3ターンのみ抜粋。残りも同じ形）。

```json
// 章
{ "id": "ch-business", "title": "ビジネス英会話", "theme": "accounting", "order": 1 }

// 登場人物
{ "id": "char-sarah", "name": "Sarah", "persona": "海外オフィスの親しみやすいマネージャー", "voiceId": "en-US-female-1" }
{ "id": "char-you",   "name": "You",   "persona": "経理担当の主人公（プレイヤー）",       "voiceId": "" }

// ストーリー
{
  "id": "story-monthly-closing",
  "chapterId": "ch-business",
  "title": "月次決算の進捗報告",
  "order": 1,
  "cast": ["char-sarah", "char-you"],
  "turns": [
    { "id": "t1", "order": 1, "type": "ai",
      "speakerId": "char-sarah", "text": "Good morning! How's the monthly closing going?",
      "translation": "おはよう！月次決算の進み具合はどう？" },
    { "id": "t2", "order": 2, "type": "user",
      "speakerId": "char-you", "text": "Good morning, Sarah. It's going well. We've finished about eighty percent.",
      "translation": "おはようございます、サラ。順調です。8割ほど終わりました。" },
    { "id": "t3", "order": 3, "type": "ai",
      "speakerId": "char-sarah", "text": "Great. When do you think you can finish the rest?",
      "translation": "いいね。残りはいつ終わりそう？" }
  ]
}
```

→ **実際のA1がこの型にきれいに収まる＝型が現実のコンテンツに耐える**ことを確認できた。

### この章で採用した設計判断（なぜ）
- **id は文字列**：人が読めて参照しやすく、後から消えない。
- **order は数値**：間に挿入しやすい（途中にセリフを足せる）。
- **translation は任意**：将来の字幕機能のための席だけ用意。今埋めても害がない。
- **reaction と閾値は config に分離**：コンテンツを軽く保ち、A/B/Cの調整を設定だけで可能に。
- **userターンの text は"お手本"**：採点はこの text と録音の一致度で行う（詳細は5章）。

---

## 3. ストーリー再生エンジン（状態機械）

### ねらい
Engine層の本体。「1ストーリーを頭から順に処理し、ユーザーのターンで録音→採点→反応の分岐を回す」ルールを、**状態（いまどの段階か）** と **遷移（次に何が起きるか）** として定義する。状態が明確だと、UIは「今の状態を表示するだけ」になり、修正を頼んでも壊れにくい。

### エンジンが持つ状態データ
```
{
  storyId,            // 再生中のストーリー
  currentTurnIndex,   // 今が何番目のターンか
  status,             // 下の「状態」のどれか
  lastScore,          // 直近の採点（数値）
  lastTier            // 直近の判定（A / B / C）
}
```

### 状態（status）の一覧
| 状態 | 何をしている | UIの見え方 |
|---|---|---|
| `Ready` | 開始前 | 「はじめる」ボタン |
| `PlayingAiTurn` | AIのセリフを音声再生中 | セリフ表示＋スピーカー |
| `AwaitingUser` | ユーザーの番。録音待ち | お手本セリフ＋録音ボタン |
| `Recording` | 録音中 | 録音インジケータ・停止ボタン |
| `Transcribing` | 文字起こし中 | 「聞き取り中…」 |
| `Scoring` | 採点中 | 「採点中…」 |
| `ShowingReaction` | 判定とキャラ反応を表示 | A/B/C ＋ 反応セリフ |
| `StoryComplete` | 全ターン終了 | 「ストーリークリア！」 |
| `Error` | 録音・通信などの失敗 | エラー表示＋やり直し |

### 状態遷移図
```
[Ready]
   │ start()
   ▼
[Advance] ──(残りのターン無し)──▶ [StoryComplete] ─▶ Progress更新
   │
   ├─(次が ai)───▶ [PlayingAiTurn] ──(再生終了)──▶ [Advance]
   │
   └─(次が user)─▶ [AwaitingUser] ──(録音ボタン)──▶ [Recording]
                                                       │ (停止)
                                                       ▼
                                                  [Transcribing] ──(失敗)──▶ [Error] ─▶ [AwaitingUser]
                                                       │ (成功)
                                                       ▼
                                                   [Scoring]
                                                       │
                                                       ▼
                                               [ShowingReaction] ──(次へ)─────▶ [Advance]
                                                       └──(任意: もう一回)────▶ [AwaitingUser]
```

### 進行ロジック（`Advance` ＝次のターンへ）
- 次のターンが**無ければ** → `StoryComplete`（Progressを更新）
- 次が `type:"ai"` → `PlayingAiTurn`
- 次が `type:"user"` → `AwaitingUser`

### A1での具体的な流れ（例）
`Ready` →(はじめる)→ **t1 ai**「Good morning!…」をTTS再生 → **t2 user**：お手本表示→録音→文字起こし→採点(A/B/C)→反応表示 → **t3 ai** … →（t4〜t7 同様）→ `StoryComplete`「クリア！」

### エンジンが外部に頼むこと（Adapter / Content との境目）
| 状態 | 呼ぶもの | 層 |
|---|---|---|
| `PlayingAiTurn` | `TTS.speak(セリフ, 声ID)` | Adapter |
| `Recording` | `SpeechInput.start()`（録音＋認識を開始） | Adapter |
| `Transcribing` | `SpeechInput.stop() → { transcript }` | Adapter |
| `Scoring` | `Scorer.score(テキスト, お手本) → {score, tier}` | Adapter |
| `ShowingReaction` | 設定の `reaction[tier]` を表示（任意でTTS） | Content/設定 |
| `StoryComplete` | `Progress.save(...)` | データ保存 |

> ポイント：**エンジン自身はAPIを直接叩かない**。すべてAdapterの"窓口"越しに頼む。だからAPIを差し替えても、この状態機械は1行も変わらない。

### MVPでの割り切り
- 採点が低くても**やり直しは任意**（MVPは「反応を見て次へ」で進む。retryは後で足せる）。
- `user` ターンの話者は主人公で固定。
- エラー時は「もう一度」だけ用意（細かいリトライ制御は後回し）。

### 設計判断（なぜ状態機械にするか）
- 「今どの状態か」が常に1つに定まる → UIもAIも判断に迷わず、バグりにくい。
- **状態と遷移を足すだけ**で機能拡張できる（例：字幕表示・retry・ヒント表示）。

---

## 4. アダプタ設計（差し込み口）

### ねらい
Engineが外部機能を頼む「**窓口の形（インターフェース）**」を固定する。窓口さえ決めておけば、中身（どのAPIを使うか）は後でいくらでも差し替えられる＝「壊れない」の正体。

### 考え方：実装を外から渡す（依存性の注入 / DI）
Engineは「窓口の形」だけを知り、**実際の実装は外から渡す**。

```
Engine（窓口の形だけ知る）  ←  実装を外から注入  ←  [ MVP実装 / 本格実装 / テスト用モック ]
```

→ テスト時は偽物（モック）、MVPは簡易版、本番は本格版、と**差し替え自由**。

### 窓口の一覧（4つ ＋1）

#### 1) SpeechInput（音声入力：録音＋文字起こし）
無料のブラウザ音声認識(Web Speech API)は録音と文字起こしが一体なので、1つの窓口にまとめる。
```ts
interface SpeechInput {
  start(): void
  stop(): Promise<{ transcript: string; audio?: AudioBlob }>   // 止めて結果を返す
}
```
- MVP：ブラウザの Web Speech API（無料・サーバー不要）
- 将来：MediaRecorderで録音 → Whisper で文字起こし（stop() が {transcript, audio} を返す形でそのまま入る）

#### 2) TTS（音声合成）
```ts
interface TTS {
  speak(text: string, voiceId: string): Promise<void>   // テキスト → 音声を再生
}
```
- MVP：ブラウザの SpeechSynthesis（無料）／ または OpenAI・Azure TTS
- 将来：ElevenLabs（高品質・訛り再現）

#### 3) Scorer（採点）
```ts
interface Scorer {
  score(input: {
    transcript: string;   // 文字起こし結果
    expected: string;     // お手本テキスト
    audio?: AudioBlob;    // 本格採点で使う（任意）
  }): Promise<{ score: number; tier: "A" | "B" | "C" }>
}
```
- MVP：一致率（transcript と expected の近さ）で採点
- 将来：Azure Pronunciation Assessment（音素レベル・audioを使用）

#### ＋) ProgressStore（進捗保存）
```ts
interface ProgressStore {
  save(p: Progress): Promise<void>
  load(userId: string, storyId: string): Promise<Progress | null>
}
```
- MVP：localStorage（ブラウザ内）
- 将来：データベース

### MVPの組み合わせ（最初の一歩）の判断
録音→文字起こしには2つの道がある：

| 道 | 中身 | 長所 | 短所 |
|---|---|---|---|
| **A. Web Speech API**（最速・おすすめ） | ブラウザが録音と文字起こしを一括 | 無料・実装が最小・サーバー不要 | ブラウザ依存（iOS Safariは弱い）／生音声を採点に使えない |
| **B. 録音 → Whisper** | MediaRecorderで録音→APIで文字起こし | 安定・生音声が残る（将来の音素採点に必須） | 少額の費用・実装が増える |

→ **まず A で「動く」を最速で達成 → 本格採点が欲しくなったら B に差し替え**（Engineは無傷）。これがアダプタ設計の効きどころ。

### 設計判断
- 窓口（interface）は**小さく・安定的に**保つ（メソッドを増やしすぎない）。
- やり取りするデータの形（`AudioBlob` など）も**固定**しておく。
- 実装は外から注入 → 差し替え・テストが自由。

---

## 5. 採点とA/B/C判定の仕組み

### ねらい
「録音した英語をどう点数化し、A/B/Cに振り分けるか」を決める。MVPは簡易版、将来は本格版に差し替え（4章の `Scorer` 窓口はそのまま）。

### MVPの採点ロジック（一致率ベース）
考え方：**「文字起こし結果が、お手本にどれだけ近いか」を点数にする**。
（＝ASRが正しく聞き取れた＝あなたの発話が"伝わった"、を測る素朴で妥当な指標）

手順：
1. **正規化**（比較しやすく整える）：小文字化／記号除去／空白整理
2. **近さを計算**（0〜100）：編集距離（Levenshtein）→ 一致率に変換
3. **閾値でA/B/C判定**（設定で変えられる）

```ts
function score({ transcript, expected }) {
  const a = normalize(transcript)   // 小文字・記号除去・空白整理
  const b = normalize(expected)
  const similarity = 1 - editDistance(a, b) / Math.max(a.length, b.length)
  const value = Math.round(similarity * 100)              // 0〜100
  const tier = value >= 90 ? "A" : value >= 70 ? "B" : "C"
  return { score: value, tier }
}
```

### 設定（config）にまとめるもの
```ts
const scoringConfig = {
  thresholds: { A: 90, B: 70 },   // 90以上=A, 70以上=B, それ未満=C
  reactions: {
    A: "Good job!",
    B: "You're doing great!",
    C: "Let's try a little harder.",
  },
}
```
- 閾値も反応文も**ここを書き換えるだけ**で調整できる（コードは触らない）。
- 「A/B/C/D に増やす」も設定の拡張で対応。

### 正直な注意点（このMVP採点の限界）
- これは **「正しい単語を言えたか（伝わりやすさ）」** を測るもので、**「th の発音が甘い」等、音そのものの良し悪しは判定できません**。
- それでもMVPとしては十分妥当：聞き取ってもらえた＝通じた、の良い近似。
- **本格的な発音採点が欲しくなったら**、`Scorer` の中身を **Azure Pronunciation Assessment**（音素レベル・audioを使用）に差し替える。返す形は同じ `{ score, tier }` なので、**Engineもconfigもそのまま**。

### 地味な落とし穴：数字・表記ゆれ
- 例：「eighty percent」を ASR が「80%」と返すと、文字列としては不一致になりがち。
- MVPの対処：正規化で**数字↔英単語を寄せる**簡単な処理を入れる。または最初のストーリーは紛らわしい数字を避ける。
- これは「動かしてみて」調整する類の項目。設計段階では「ここに気をつける」と覚えておけば十分。

### 設計判断
- 採点ロジックは `Scorer` の中だけに閉じ込める（Engineは結果しか見ない）。
- 閾値・反応は config に分離（調整＝設定変更）。
- MVPは"完璧な採点"を狙わない。まず A/B/C が動くことを優先。

---

## 6. フォルダ構成・技術スタック

### ねらい
これまでの4層を**実際のフォルダ**に対応させる。「どこに何があるか」が一目で分かる＝新規参加者（人・AI）が迷わない地図。

### フォルダ構成（案）
**1フォルダ＝1つの層**になるよう分ける。

```
storyou/
├─ app/                      # ▼ UI層：Next.jsの画面
│  ├─ layout.tsx
│  ├─ page.tsx               # トップ（ストーリー選択）
│  └─ story/[id]/page.tsx    # ストーリー再生画面
├─ components/               # ▼ UI層：画面の部品
│  ├─ TurnView.tsx           # セリフ表示
│  ├─ RecordButton.tsx       # 録音ボタン
│  └─ ReactionView.tsx       # A/B/Cと反応表示
├─ engine/                   # ▼ Engine層：状態機械・ロジック
│  ├─ types.ts               # 状態・型
│  ├─ storyEngine.ts         # 状態遷移ロジック
│  └─ useStoryEngine.ts      # Reactから使うhook
├─ adapters/                 # ▼ Adapter層：窓口＋実装
│  ├─ interfaces.ts          # 窓口の形（SpeechInput/TTS/Scorer ほか）
│  ├─ index.ts               # ★どの実装を使うか配線（createAdapters）
│  ├─ speech.webspeech.ts    # Web Speech API（録音＋文字起こし）
│  ├─ tts.webspeech.ts       # SpeechSynthesis（読み上げ）
│  └─ scorer.similarity.ts   # 一致率採点
├─ content/                  # ▼ Content層：データ（ストーリー）
│  ├─ schema.ts              # ★データの型（2章の型）＝"単一の真実"
│  ├─ characters.ts          # 登場人物
│  └─ stories/
│     └─ monthly-closing.ts  # A1ストーリー（コンテンツ第1号）
├─ config/
│  └─ scoring.ts             # 閾値・反応文（5章）
├─ lib/
│  └─ text.ts                # normalize / editDistance など
├─ docs/                     # 設計ドキュメント（作成済み）
├─ README.md                 # 起動方法・全体の地図
├─ CLAUDE.md                 # AI（私）向けの約束事
└─ package.json …            # 設定ファイル群
```

### 「足すとき、どこへ？」が一目で分かる
- **新しいストーリー** → `content/stories/` にファイルを1つ追加
- **APIを差し替え** → `adapters/` に新実装を足し、`adapters/index.ts` の1行を変更
- **画面を変える** → `app/` `components/`
- **採点の閾値・反応** → `config/scoring.ts`

→ 触る場所が常に1か所に限定される。これが「壊れない」の実感。

### 技術スタック（案）

| 領域 | 採用 | 理由 |
|---|---|---|
| 言語 | **TypeScript** | 型で"単一の真実"を作れる。人にもAIにも優しい |
| フレームワーク | **Next.js（App Router）** | Web＝デスクトップ開発＆スマホ対応を一本化、デプロイが楽 |
| UI | **React + Tailwind CSS** | 標準的で速い。モバイルファーストにしやすい |
| 状態管理 | **プレーンなTSの状態機械 + React hook** | 初心者に分かりやすい（XStateの導入は任意） |
| 音声 | **ブラウザ標準API**（MVP） | 無料・サーバー不要 |
| 保存 | **localStorage**（MVP） | バックエンド不要 |
| デプロイ | **Vercel** | Next.jsと相性◎、URLで即共有 |

> **MVPはバックエンド不要**（ブラウザだけで完結）。将来Whisper等に進むときに `app/api/...` を足す。

### 設計判断
- **1フォルダ＝1層**で、責務の境界をフォルダで物理的に表現する。
- `content/schema.ts` を**データの型の唯一の置き場所**にする（2章の型をここに実装）。
- `adapters/index.ts` を**唯一の配線場所**にして、差し替えを1か所に集約する。

---

## 7. 拡張マップ

### ねらい
新しい設計ではなく、これまでの全部を **「将来Xを足すなら、どこを触る／触らない」の早見表**にまとめる総仕上げ。最初に心配していた「足したら壊れる？」への最終回答。

### 拡張マップ（早見表）

| 将来やりたいこと | 触る場所 | Engineへの影響 | 設計根拠 |
|---|---|---|---|
| ストーリーを追加（A2, C1…） | `content/stories/` に1ファイル | **変更なし** | 2章 |
| 章を増やす（ビジネス/エンジニア編） | `content/`（Chapterデータ） | **変更なし** | 2章 |
| 登場人物を増やす | `content/characters.ts` | **変更なし** | 2章 |
| 会話の参加人数を増やす | Storyの `cast` / Turnの `speaker`（データ） | **変更なし（対応済）** | 2,3章 |
| 訛りつき音声 | `Character.voiceId` ＋ `adapters/tts.*` | **変更なし** | 2,4章 |
| 文字起こしを高精度化（Whisper） | `adapters/asr.whisper.ts` ＋ `index.ts` | **変更なし** | 4章 |
| 本格的な発音評価（Azure） | `adapters/scorer.azure.ts` ＋ `index.ts` | **変更なし** | 4,5章 |
| A/B/C → A/B/C/D に細分化 | `config/scoring.ts` | **変更なし** | 5章 |
| 字幕・和訳表示 | UI ＋ `Turn.translation`（既にデータにある） | 状態を1つ追加（小） | 2,3章 |
| やり直し（retry） | `engine` に状態/遷移を1つ追加 ＋ UI | 状態を1つ追加（小） | 3章 |
| 進捗・章クリア表示 | Progressから導出 ＋ UI | **変更なし** | 2章 |
| ログイン／データをDB保存 | `adapters/progress.*` をDB実装に差し替え ＋ 認証 | アダプタ差し替え | 4章 |
| スマホアプリ化（アプリストア） | Capacitorで包む（配信のみ） | **変更なし** | 1章 |
| 自由会話モード（LLM） | LLMアダプタ追加 ＋ 新しい再生モード | 新モード追加（中） | 4章 |

→ ロードマップ上の拡張は、ほぼ全部が **「データ追加」「アダプタ差し替え」「状態を1つ足す」** のどれかに収まる。**既存を書き換える（壊す）作業はほぼ発生しない。**

### 具体例：レシピ集
- **A2ストーリーを足す** → `content/stories/invoice.ts` を作って `content/schema.ts` の型に沿って書く。以上。
- **発音評価をAzureに上げる** → `adapters/scorer.azure.ts` を作り、`adapters/index.ts` の `scorer` を差し替える1行。Engineもconfigも無傷。
- **訛りを足す** → `Character.voiceId` を変え、`tts.*` がその声を出せるようにする。

### 正直に：本当にEngineを書き換えるのはどんな時？
- 「会話の進め方そのもの」を根本から変えるとき（例：台本型を完全にやめ、ターンの概念を捨てて全面自由会話に移行）。
- これは**通常のロードマップでは起きない**。起きるとしたら、それは「別アプリを作る」レベルの方針転換のとき。
- 逆に言えば、**普通の機能追加でEngineを触ることはまずない**——これが目指した「壊れない大枠」。

---

## ✅ 設計書 完成（v1.0）

これで Storyou の設計の大枠が固まりました。

- **1章** 全体アーキテクチャ（4層）／ **2章** データモデル ／ **3章** 再生エンジン（状態機械）
- **4章** アダプタ設計 ／ **5章** 採点とA/B/C ／ **6章** フォルダ構成・技術スタック ／ **7章** 拡張マップ

次のフェーズは **実装**。最初の一歩は、2章のデータモデルをコード化する `content/schema.ts`（＝"単一の真実"）から。
