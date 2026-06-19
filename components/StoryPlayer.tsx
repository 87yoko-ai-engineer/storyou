"use client";

// components/StoryPlayer.tsx
// ストーリー再生画面のまとめ役。engine(useStoryEngine) と adapters をつなぎ、
// 状態(status)に応じて表示を切り替える。UIは「状態を映す」だけ。

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Story } from "@/content/schema";
import { useStoryEngine } from "@/engine/useStoryEngine";
import { createAdapters } from "@/adapters";
import { isSpeechInputSupported } from "@/adapters/speech.webspeech";
import { TurnView } from "./TurnView";
import { ReactionView } from "./ReactionView";
import { RecordButton } from "./RecordButton";

const primaryBtn =
  "rounded-full bg-gray-900 px-6 py-3 text-base font-semibold text-white transition active:scale-95 hover:bg-gray-700";
const secondaryBtn =
  "rounded-full border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 transition active:scale-95 hover:bg-gray-50";

export default function StoryPlayer({ story }: { story: Story }) {
  // アダプタは一度だけ生成（差し替えは adapters/index.ts 側で行う）
  const adapters = useMemo(() => createAdapters(), []);
  const { state, currentTurn, actions } = useStoryEngine(story, adapters);

  const [supported, setSupported] = useState(true);
  useEffect(() => {
    setSupported(isSpeechInputSupported());
  }, []);

  const total = story.turns.length;
  const stepNo = Math.min(state.currentTurnIndex + 1, total);
  const showProgress = state.status !== "Ready" && state.status !== "StoryComplete";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-500 transition hover:text-gray-900">
          ← もどる
        </Link>
        <span className="text-sm text-gray-400">{story.title}</span>
      </header>

      {!supported && (
        <p className="mb-4 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-800">
          このブラウザは音声認識に未対応かもしれません。PCの Google Chrome での利用をおすすめします。
        </p>
      )}

      {showProgress && (
        <div className="mb-4">
          <div className="mb-1 text-xs text-gray-400">
            セリフ {stepNo} / {total}
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-gray-800 transition-all"
              style={{ width: `${(stepNo / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <section className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full rounded-2xl bg-white p-6 shadow-sm">{renderBody()}</div>
      </section>
    </main>
  );

  function renderBody() {
    switch (state.status) {
      case "Ready":
        return (
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">{story.title}</h1>
            <p className="mb-6 text-sm text-gray-500">
              主人公はあなた。録音して会話を進めよう。
            </p>
            <button type="button" onClick={actions.start} className={primaryBtn}>
              はじめる
            </button>
          </div>
        );

      case "PlayingAiTurn":
        return (
          <div>
            {currentTurn && <TurnView turn={currentTurn} />}
            <p className="mt-5 text-center text-sm text-gray-400">🔊 再生中…</p>
          </div>
        );

      case "AwaitingUser":
        return (
          <div>
            <p className="mb-3 text-center text-sm text-gray-400">
              あなたの番です。声に出して言ってみよう
            </p>
            {currentTurn && <TurnView turn={currentTurn} />}
            <div className="mt-6 flex justify-center">
              <RecordButton
                recording={false}
                onStart={actions.startRecording}
                onStop={actions.stopRecording}
              />
            </div>
          </div>
        );

      case "Recording":
        return (
          <div>
            {currentTurn && <TurnView turn={currentTurn} />}
            <p className="mt-4 text-center text-sm text-red-500">● 録音中… 終わったら停止</p>
            <div className="mt-4 flex justify-center">
              <RecordButton
                recording
                onStart={actions.startRecording}
                onStop={actions.stopRecording}
              />
            </div>
          </div>
        );

      case "Transcribing":
        return <p className="py-6 text-center text-gray-500">聞き取り中…</p>;

      case "Scoring":
        return <p className="py-6 text-center text-gray-500">採点中…</p>;

      case "ShowingReaction":
        return (
          <div>
            {state.lastTier && (
              <ReactionView
                tier={state.lastTier}
                score={state.lastScore ?? 0}
                transcript={state.lastTranscript ?? ""}
                expected={currentTurn?.text ?? ""}
              />
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={actions.retry} className={secondaryBtn}>
                もう一度
              </button>
              <button type="button" onClick={actions.next} className={primaryBtn}>
                次へ
              </button>
            </div>
          </div>
        );

      case "StoryComplete":
        return (
          <div className="text-center">
            <div className="mb-3 text-5xl">🎉</div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">ストーリークリア！</h2>
            <p className="mb-6 text-sm text-gray-500">
              「{story.title}」を最後までやり切りました。
            </p>
            <Link href="/" className={`${primaryBtn} inline-block`}>
              トップへもどる
            </Link>
          </div>
        );

      case "Error":
        return (
          <div className="text-center">
            <p className="mb-4 text-sm text-red-600">
              {state.errorMessage ?? "エラーが発生しました。"}
            </p>
            <button type="button" onClick={actions.retry} className={primaryBtn}>
              もう一度
            </button>
          </div>
        );

      default:
        return null;
    }
  }
}
