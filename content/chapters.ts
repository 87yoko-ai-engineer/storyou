// content/chapters.ts
// 章の定義。章を増やすときはここに追加する。

import type { Chapter } from "./schema";

/** ビジネス英会話（会計テーマ）の章。 */
export const BUSINESS: Chapter = {
  id: "ch-business",
  title: "ビジネス英会話",
  theme: "accounting",
  order: 1,
};

/** ID から章を引くための一覧。 */
export const CHAPTERS: Record<string, Chapter> = {
  [BUSINESS.id]: BUSINESS,
};
