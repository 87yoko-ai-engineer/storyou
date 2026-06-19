"use client";

// engine/useStoryEngine.ts
// 純粋なロジック(storyEngine)を React につなぎ、アダプタ（録音・採点など）を呼ぶ橋渡し。
// UIはこのフックが返す state を表示し、actions を呼ぶだけでよい。

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Story } from "@/content/schema";
import { getCharacter } from "@/content/characters";
import type { Adapters } from "@/adapters/interfaces";
import { createInitialState, currentTurn, reduce } from "./storyEngine";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function useStoryEngine(story: Story, adapters: Adapters) {
  const [state, dispatch] = useReducer(reduce, story, createInitialState);

  // 最新の state / adapters を非同期処理から参照するための ref（古い値の参照を防ぐ）
  const stateRef = useRef(state);
  stateRef.current = state;
  const adaptersRef = useRef(adapters);
  adaptersRef.current = adapters;

  // AIのターンに入ったら自動でTTS再生 → 終わったら次のターンへ
  useEffect(() => {
    if (state.status !== "PlayingAiTurn") return;
    const turn = currentTurn(state);
    if (!turn) return;

    const voiceId = getCharacter(turn.speakerId)?.voiceId ?? "";
    let cancelled = false;

    Promise.resolve(adaptersRef.current.tts.speak(turn.text, voiceId))
      .then(() => {
        if (!cancelled) dispatch({ type: "AI_TURN_ENDED" });
      })
      .catch((e) => {
        if (!cancelled) dispatch({ type: "ERROR", message: errMsg(e) });
      });

    return () => {
      cancelled = true;
    };
  }, [state.status, state.currentTurnIndex, state]);

  /** はじめる */
  const start = useCallback(() => dispatch({ type: "START" }), []);

  /** 録音を開始 */
  const startRecording = useCallback(async () => {
    try {
      await Promise.resolve(adaptersRef.current.speech.start());
      dispatch({ type: "RECORD_START" });
    } catch (e) {
      dispatch({ type: "ERROR", message: errMsg(e) });
    }
  }, []);

  /** 録音を停止 → 文字起こし → 採点まで一気に進める */
  const stopRecording = useCallback(async () => {
    const a = adaptersRef.current;
    dispatch({ type: "RECORD_STOP" }); // → Transcribing（UI: 処理中）
    try {
      const { transcript, audio } = await a.speech.stop();
      dispatch({ type: "TRANSCRIBED", transcript }); // → Scoring

      const expected = currentTurn(stateRef.current)?.text ?? "";
      const { score, tier } = await a.scorer.score({ transcript, expected, audio });
      dispatch({ type: "SCORED", score, tier }); // → ShowingReaction
    } catch (e) {
      dispatch({ type: "ERROR", message: errMsg(e) });
    }
  }, []);

  /** 反応を見て次へ */
  const next = useCallback(() => dispatch({ type: "NEXT" }), []);

  /** もう一度 / やり直し */
  const retry = useCallback(() => dispatch({ type: "RETRY" }), []);

  const turn = currentTurn(state);
  const speaker = turn ? getCharacter(turn.speakerId) : undefined;

  return {
    state,
    currentTurn: turn,
    speaker,
    actions: { start, startRecording, stopRecording, next, retry },
  };
}
