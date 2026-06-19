// content/stories/monthly-closing.ts
// A1ストーリー「月次決算の進捗報告」＝コンテンツ第1号。
// 新しいストーリーを足すときは、このファイルをお手本に同じ形で書き、content/index.ts に登録する。

import type { Story } from "../schema";
import { YOU, SARAH } from "../characters";
import { BUSINESS } from "../chapters";

export const monthlyClosing: Story = {
  id: "story-monthly-closing",
  chapterId: BUSINESS.id,
  title: "月次決算の進捗報告",
  order: 1,
  cast: [SARAH.id, YOU.id],
  turns: [
    {
      id: "t1",
      order: 1,
      type: "ai",
      speakerId: SARAH.id,
      text: "Good morning! How's the monthly closing going?",
      translation: "おはよう！月次決算の進み具合はどう？",
    },
    {
      id: "t2",
      order: 2,
      type: "user",
      speakerId: YOU.id,
      text: "Good morning, Sarah. It's going well. We've finished about eighty percent.",
      translation: "おはようございます、サラ。順調です。8割ほど終わりました。",
    },
    {
      id: "t3",
      order: 3,
      type: "ai",
      speakerId: SARAH.id,
      text: "Great. When do you think you can finish the rest?",
      translation: "いいね。残りはいつ終わりそう？",
    },
    {
      id: "t4",
      order: 4,
      type: "user",
      speakerId: YOU.id,
      text: "I expect to finish by Thursday this week.",
      translation: "今週の木曜までには終わる見込みです。",
    },
    {
      id: "t5",
      order: 5,
      type: "ai",
      speakerId: SARAH.id,
      text: "Perfect. Is there anything you need help with?",
      translation: "完璧。何か手伝えることはある？",
    },
    {
      id: "t6",
      order: 6,
      type: "user",
      speakerId: YOU.id,
      text: "Not for now. I'll let you know if anything comes up.",
      translation: "今のところ大丈夫です。何かあれば連絡します。",
    },
    {
      id: "t7",
      order: 7,
      type: "ai",
      speakerId: SARAH.id,
      text: "Sounds good. Thanks for the update!",
      translation: "いいね。報告ありがとう！",
    },
  ],
};
