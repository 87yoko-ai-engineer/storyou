// components/ReactionView.tsx
// 採点結果（A/B/C・スコア・反応文・あなたの発話・お手本）を表示する部品。

import type { Tier } from "@/content/schema";
import { reactionFor } from "@/config/scoring";

const tierStyle: Record<Tier, string> = {
  A: "bg-green-100 text-green-700",
  B: "bg-sky-100 text-sky-700",
  C: "bg-amber-100 text-amber-700",
};

export function ReactionView({
  tier,
  score,
  transcript,
  expected,
}: {
  tier: Tier;
  score: number;
  transcript: string;
  expected: string;
}) {
  return (
    <div className="text-center">
      <div
        className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold ${tierStyle[tier]}`}
      >
        {tier}
      </div>
      <p className="mb-1 text-lg font-semibold text-gray-900">{reactionFor(tier)}</p>
      <p className="mb-4 text-sm text-gray-400">スコア {score} / 100</p>

      <div className="space-y-2 text-left">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <div className="text-xs text-gray-400">あなたの発話</div>
          <div className="text-sm text-gray-800">{transcript || "（聞き取れませんでした）"}</div>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <div className="text-xs text-gray-400">お手本</div>
          <div className="text-sm text-gray-800">{expected}</div>
        </div>
      </div>
    </div>
  );
}
