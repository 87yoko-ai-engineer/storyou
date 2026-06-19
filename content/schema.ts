// content/schema.ts
// アプリの「中身（コンテンツ）」を表すデータの型 ＝ 単一の真実(single source of truth)。
// 設計書 docs/02-design.md「2. データモデル」に対応。

/** 採点の判定ランク */
export type Tier = "A" | "B" | "C";

/** ターンの種類: ai = キャラが話す / user = ユーザーが録音する */
export type TurnType = "ai" | "user";

/** 登場人物 */
export interface Character {
  id: string;
  /** 表示名（例: "Sarah"） */
  name: string;
  /** 性格・役割の説明（音声合成や将来のLLMの参考） */
  persona: string;
  /** 使う声のID（訛り対応はここを増やすだけ。主人公など声不要なら空文字） */
  voiceId: string;
}

/** セリフ（1ターン）。ストーリーの turns に order 順で並ぶ。 */
export interface Turn {
  id: string;
  /** ストーリー内の順番（1始まり） */
  order: number;
  type: TurnType;
  /** 話者の Character ID */
  speakerId: string;
  /** 英語のセリフ（user ターンでは "お手本" になる） */
  text: string;
  /** 和訳（将来の字幕用・任意） */
  translation?: string;
}

/** ストーリー（1つのシーン） */
export interface Story {
  id: string;
  /** どの章に属するか */
  chapterId: string;
  title: string;
  /** 章内の並び順 */
  order: number;
  /** 登場人物（Character ID の一覧） */
  cast: string[];
  /** セリフの並び（order 順） */
  turns: Turn[];
}

/** 章 */
export interface Chapter {
  id: string;
  title: string;
  /** テーマ（例: "accounting"） */
  theme: string;
  order: number;
}

/** 進捗（ユーザー × ストーリー） */
export interface Progress {
  /** 誰の進捗か（MVPはログイン無しなので固定値でOK） */
  userId: string;
  storyId: string;
  cleared: boolean;
  /** 最高判定 */
  bestTier?: Tier;
  /** 最高スコア（0〜100） */
  bestScore?: number;
}
