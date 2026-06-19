// config/scoring.ts
// 採点の閾値と、A/B/C ごとのキャラの反応文。
// 調整したいときはこのファイルだけを書き換える（コードは触らない）。
// 設計書 docs/02-design.md「5. 採点とA/B/C判定の仕組み」に対応。

import type { Tier } from "@/content/schema";

export const scoringConfig = {
  /** この点以上で A、その下で B、さらに下は C */
  thresholds: { A: 90, B: 70 },
  /** A/B/C それぞれのキャラの反応文 */
  reactions: {
    A: "Good job!",
    B: "You're doing great!",
    C: "Let's try a little harder.",
  } as Record<Tier, string>,
};

/** スコア(0〜100)を A/B/C に変換する。 */
export function toTier(score: number): Tier {
  if (score >= scoringConfig.thresholds.A) return "A";
  if (score >= scoringConfig.thresholds.B) return "B";
  return "C";
}

/** 判定に対応する反応文を返す。 */
export function reactionFor(tier: Tier): string {
  return scoringConfig.reactions[tier];
}
