// adapters/interfaces.ts
// 外部機能の「窓口の形（契約）」だけを定義する。中身の実装は別ファイル。
// エンジンはこの契約にだけ依存するので、実装（使うAPI）を後で差し替えても壊れない。
// 設計書 docs/02-design.md「4. アダプタ設計」に対応。

import type { Progress, Tier } from "@/content/schema";

/** やり取りする音声データの型（ブラウザの Blob） */
export type AudioBlob = Blob;

/** 音声入力の結果 */
export interface SpeechResult {
  /** 文字起こし結果 */
  transcript: string;
  /** 録った音声（将来の本格採点で使う・任意） */
  audio?: AudioBlob;
}

/**
 * 音声入力（録音＋文字起こし）。
 * 無料のブラウザ音声認識(Web Speech API)は録音と文字起こしが一体なので、1つの窓口にまとめている。
 * 将来 MediaRecorder + Whisper に差し替える場合も、stop() が {transcript, audio} を返す形でそのまま入る。
 */
export interface SpeechInput {
  start(): Promise<void> | void;
  /** 録音を止めて、文字起こし結果（と任意で音声）を返す */
  stop(): Promise<SpeechResult>;
}

/** 音声合成（テキスト → 音声を再生） */
export interface TTS {
  speak(text: string, voiceId: string): Promise<void>;
}

/** 採点の入力 */
export interface ScoreInput {
  /** 文字起こし結果 */
  transcript: string;
  /** お手本テキスト */
  expected: string;
  /** 本格採点で使う（任意） */
  audio?: AudioBlob;
}

/** 採点の結果 */
export interface ScoreResult {
  /** 0〜100 */
  score: number;
  tier: Tier;
}

/** 採点 */
export interface Scorer {
  score(input: ScoreInput): Promise<ScoreResult>;
}

/** 進捗の保存（MVPの基本ループでは未使用。将来の拡張用に契約だけ定義） */
export interface ProgressStore {
  save(p: Progress): Promise<void>;
  load(userId: string, storyId: string): Promise<Progress | null>;
}

/** エンジンが必要とするアダプタ一式（基本ループ用） */
export interface Adapters {
  speech: SpeechInput;
  tts: TTS;
  scorer: Scorer;
}
