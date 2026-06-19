// engine/storyEngine.ts
// 状態遷移の「純粋なロジック」。副作用（API呼び出し）は一切持たない。
// (状態, イベント) → 次の状態 を計算するだけなので、単体テストしやすい。

import type { Story, Turn } from "@/content/schema";
import type { EngineState, EngineEvent } from "./types";

/** 初期状態を作る */
export function createInitialState(story: Story): EngineState {
  return { story, status: "Ready", currentTurnIndex: -1 };
}

/** 現在のターンを取得（無ければ undefined） */
export function currentTurn(state: EngineState): Turn | undefined {
  return state.story.turns[state.currentTurnIndex];
}

/** 次のターンへ進む。次が無ければ完了、あれば ai/user で状態を分岐。 */
function advance(state: EngineState): EngineState {
  const nextIndex = state.currentTurnIndex + 1;
  const next = state.story.turns[nextIndex];

  // 残りのターンが無ければ完了
  if (!next) {
    return { ...state, currentTurnIndex: nextIndex, status: "StoryComplete" };
  }

  return {
    ...state,
    currentTurnIndex: nextIndex,
    status: next.type === "ai" ? "PlayingAiTurn" : "AwaitingUser",
    // 新しいターンに進むので直近の結果はクリア
    lastScore: undefined,
    lastTier: undefined,
    lastTranscript: undefined,
  };
}

/** エラー状態へ */
function toError(state: EngineState, message: string): EngineState {
  return { ...state, status: "Error", errorMessage: message };
}

/**
 * 状態遷移の本体。
 * 「今の状態」で「受け取ったイベント」を処理し、次の状態を返す。
 * 想定外の組み合わせは無視（状態を変えない）＝防御的。
 */
export function reduce(state: EngineState, event: EngineEvent): EngineState {
  switch (state.status) {
    case "Ready":
      if (event.type === "START") return advance(state);
      break;

    case "PlayingAiTurn":
      if (event.type === "AI_TURN_ENDED") return advance(state);
      if (event.type === "ERROR") return toError(state, event.message);
      break;

    case "AwaitingUser":
      if (event.type === "RECORD_START") return { ...state, status: "Recording" };
      break;

    case "Recording":
      if (event.type === "RECORD_STOP") return { ...state, status: "Transcribing" };
      if (event.type === "ERROR") return toError(state, event.message);
      break;

    case "Transcribing":
      if (event.type === "TRANSCRIBED")
        return { ...state, status: "Scoring", lastTranscript: event.transcript };
      if (event.type === "ERROR") return toError(state, event.message);
      break;

    case "Scoring":
      if (event.type === "SCORED")
        return {
          ...state,
          status: "ShowingReaction",
          lastScore: event.score,
          lastTier: event.tier,
        };
      if (event.type === "ERROR") return toError(state, event.message);
      break;

    case "ShowingReaction":
      if (event.type === "NEXT") return advance(state);
      // もう一度：同じユーザーターンに戻る
      if (event.type === "RETRY")
        return {
          ...state,
          status: "AwaitingUser",
          lastScore: undefined,
          lastTier: undefined,
          lastTranscript: undefined,
        };
      break;

    case "Error":
      // エラーからはユーザーの録音待ちに戻ってやり直す
      if (event.type === "RETRY")
        return { ...state, status: "AwaitingUser", errorMessage: undefined };
      break;

    case "StoryComplete":
      // 完了後は何もしない
      break;
  }

  return state;
}
