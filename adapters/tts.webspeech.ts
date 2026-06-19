"use client";

// adapters/tts.webspeech.ts
// TTS の実装：ブラウザの SpeechSynthesis（無料）。
// 将来は OpenAI / ElevenLabs などに差し替え可能。

import type { TTS } from "./interfaces";

/** このブラウザが音声合成に対応しているか。 */
export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export class WebSpeechTTS implements TTS {
  constructor(private readonly lang: string = "en-US") {}

  // 注: MVPでは voiceId は使わず lang 既定の声で読み上げる（interfaceは満たす）
  speak(text: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!isTtsSupported()) {
        reject(new Error("このブラウザは音声合成(SpeechSynthesis)に対応していません。"));
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.lang;
      u.onend = () => resolve();
      u.onerror = (e) => reject(new Error(`音声合成エラー: ${e.error}`));
      // 念のため前の発話を止めてから再生
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    });
  }
}
