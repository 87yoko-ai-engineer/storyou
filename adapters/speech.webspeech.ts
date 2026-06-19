"use client";

// adapters/speech.webspeech.ts
// SpeechInput の実装：ブラウザの Web Speech API（録音＋文字起こしが一体）。
// 無料・サーバー不要。将来は MediaRecorder + Whisper の実装に差し替え可能。

import type { SpeechInput, SpeechResult } from "./interfaces";

// Web Speech API は標準の型定義に含まれないので、必要最小限を自前で宣言する。
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionAlternativeLike>>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** このブラウザが音声認識に対応しているか。 */
export function isSpeechInputSupported(): boolean {
  return !!getCtor();
}

export class WebSpeechInput implements SpeechInput {
  private recognition: SpeechRecognitionLike | null = null;
  private finalTranscript = "";
  private pending: {
    resolve: (r: SpeechResult) => void;
    reject: (e: unknown) => void;
  } | null = null;

  constructor(private readonly lang: string = "en-US") {}

  start(): void {
    const Ctor = getCtor();
    if (!Ctor) {
      throw new Error("このブラウザは音声認識(Web Speech API)に対応していません。");
    }
    const rec = new Ctor();
    rec.lang = this.lang;
    rec.continuous = false;
    rec.interimResults = false;
    this.finalTranscript = "";

    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      this.finalTranscript = text.trim();
    };
    rec.onerror = (e) => {
      // マイク不許可は致命的なのでエラーで通知。それ以外（no-speech等）は今ある結果で続行。
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        this.settleReject(
          new Error("マイクの使用が許可されていません。ブラウザの設定で許可してください。"),
        );
      } else {
        this.settleResolve({ transcript: this.finalTranscript });
      }
    };
    rec.onend = () => {
      this.settleResolve({ transcript: this.finalTranscript });
    };

    this.recognition = rec;
    rec.start();
  }

  stop(): Promise<SpeechResult> {
    return new Promise<SpeechResult>((resolve, reject) => {
      if (!this.recognition) {
        // すでに認識が終わっている場合は、ためた結果を返す。
        resolve({ transcript: this.finalTranscript });
        return;
      }
      this.pending = { resolve, reject };
      this.recognition.stop(); // 認識を確定 → onend で resolve される
    });
  }

  private settleResolve(r: SpeechResult) {
    const p = this.pending;
    this.pending = null;
    this.recognition = null;
    p?.resolve(r);
  }

  private settleReject(e: unknown) {
    const p = this.pending;
    this.pending = null;
    this.recognition = null;
    p?.reject(e);
  }
}
