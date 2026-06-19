// engine/types.ts
// 再生エンジンの「状態」と「イベント」の型。
// 設計書 docs/02-design.md「3. ストーリー再生エンジン（状態機械）」に対応。

import type { Story, Tier } from "@/content/schema";

/** エンジンが取りうる状態（status） */
export type EngineStatus =
  | "Ready" // 開始前
  | "PlayingAiTurn" // AIのセリフを音声再生中
  | "AwaitingUser" // ユーザーの番。録音待ち
  | "Recording" // 録音中
  | "Transcribing" // 文字起こし中
  | "Scoring" // 採点中
  | "ShowingReaction" // 判定とキャラ反応を表示
  | "StoryComplete" // 全ターン終了
  | "Error"; // 失敗

/** エンジンの状態データ */
export interface EngineState {
  story: Story;
  status: EngineStatus;
  /** 現在のターンの添字（story.turns のindex）。-1 = まだ開始前 */
  currentTurnIndex: number;
  /** 直近の採点（0〜100） */
  lastScore?: number;
  /** 直近の判定 */
  lastTier?: Tier;
  /** 直近の文字起こし結果（表示・デバッグ用） */
  lastTranscript?: string;
  /** エラーメッセージ */
  errorMessage?: string;
}

/** エンジンに送るイベント */
export type EngineEvent =
  | { type: "START" } // はじめる
  | { type: "AI_TURN_ENDED" } // AIの再生が終わった
  | { type: "RECORD_START" } // 録音開始
  | { type: "RECORD_STOP" } // 録音停止（音声取得は副作用側で行う）
  | { type: "TRANSCRIBED"; transcript: string } // 文字起こし完了
  | { type: "SCORED"; score: number; tier: Tier } // 採点完了
  | { type: "NEXT" } // 反応を見て次へ
  | { type: "RETRY" } // もう一度（同じユーザーターン）
  | { type: "ERROR"; message: string }; // 失敗
