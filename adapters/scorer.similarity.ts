// adapters/scorer.similarity.ts
// Scorer の実装：文字起こし結果とお手本の「一致率」で採点する簡易版。
// 将来は Azure Pronunciation Assessment（音素レベル）に差し替え可能。

import type { Scorer, ScoreInput, ScoreResult } from "./interfaces";
import { similarityScore } from "@/lib/text";
import { toTier } from "@/config/scoring";

export class SimilarityScorer implements Scorer {
  async score({ transcript, expected }: ScoreInput): Promise<ScoreResult> {
    const score = similarityScore(transcript, expected);
    return { score, tier: toTier(score) };
  }
}
