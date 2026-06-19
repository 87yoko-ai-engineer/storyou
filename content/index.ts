// content/index.ts
// コンテンツの入口。ストーリーを増やしたら STORIES に1行登録するだけ。

import type { Story } from "./schema";
import { monthlyClosing } from "./stories/monthly-closing";

/** ID からストーリーを引くための一覧。新しいストーリーはここに登録する。 */
export const STORIES: Record<string, Story> = {
  [monthlyClosing.id]: monthlyClosing,
};

/** すべてのストーリー（order 順）。 */
export const ALL_STORIES: Story[] = Object.values(STORIES).sort(
  (a, b) => a.order - b.order,
);

/** ID からストーリーを取得（見つからなければ undefined）。 */
export function getStory(id: string): Story | undefined {
  return STORIES[id];
}
