// components/TurnView.tsx
// 1つのセリフ（話者名・英語・和訳）を表示する見た目だけの部品。

import type { Turn } from "@/content/schema";
import { getCharacter } from "@/content/characters";

export function TurnView({ turn }: { turn: Turn }) {
  const speaker = getCharacter(turn.speakerId);
  return (
    <div>
      {speaker && (
        <div className="mb-2 text-sm font-medium text-gray-400">{speaker.name}</div>
      )}
      <p className="text-xl font-semibold leading-relaxed text-gray-900">{turn.text}</p>
      {turn.translation && (
        <p className="mt-2 text-sm text-gray-500">{turn.translation}</p>
      )}
    </div>
  );
}
