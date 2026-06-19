// components/RecordButton.tsx
// 録音／停止を切り替える大きめのボタン。

export function RecordButton({
  recording,
  onStart,
  onStop,
}: {
  recording: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <button
      type="button"
      onClick={recording ? onStop : onStart}
      className={
        recording
          ? "flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition active:scale-95 animate-pulse"
          : "flex h-20 w-20 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition active:scale-95 hover:bg-gray-700"
      }
      aria-label={recording ? "録音を停止" : "録音を開始"}
    >
      <span className="text-2xl">{recording ? "■" : "🎤"}</span>
    </button>
  );
}
