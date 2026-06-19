// content/characters.ts
// 登場人物の定義。新しいキャラを足すときはここに追加する。

import type { Character } from "./schema";

/** 主人公（プレイヤー）。ユーザーが録音するので声IDは不要。 */
export const YOU: Character = {
  id: "char-you",
  name: "You",
  persona: "経理担当の主人公（プレイヤー）",
  voiceId: "",
};

/** 海外オフィスの親しみやすいマネージャー。 */
export const SARAH: Character = {
  id: "char-sarah",
  name: "Sarah",
  persona: "海外オフィスの親しみやすいマネージャー",
  voiceId: "en-US-female-1",
};

/** ID から登場人物を引くための一覧。 */
export const CHARACTERS: Record<string, Character> = {
  [YOU.id]: YOU,
  [SARAH.id]: SARAH,
};

/** ID から登場人物を取得（見つからなければ undefined）。 */
export function getCharacter(id: string): Character | undefined {
  return CHARACTERS[id];
}
