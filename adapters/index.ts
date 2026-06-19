"use client";

// adapters/index.ts
// どの実装を使うかを1か所で配線する「差し替えポイント」。
// 例: 音声認識を Whisper に変えたいときは、ここの speech を差し替えるだけ。

import type { Adapters } from "./interfaces";
import { WebSpeechInput } from "./speech.webspeech";
import { WebSpeechTTS } from "./tts.webspeech";
import { SimilarityScorer } from "./scorer.similarity";

/** MVPで使うアダプタ一式を生成する。ブラウザ上で呼ぶこと。 */
export function createAdapters(): Adapters {
  return {
    speech: new WebSpeechInput("en-US"),
    tts: new WebSpeechTTS("en-US"),
    scorer: new SimilarityScorer(),
  };
}
