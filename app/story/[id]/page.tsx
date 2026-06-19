// app/story/[id]/page.tsx
// ストーリー再生画面。URL の id からストーリーを取り出し、再生UIに渡す。
// （データ取得はサーバー側、再生UIはクライアント側）

import { notFound } from "next/navigation";
import { getStory } from "@/content";
import StoryPlayer from "@/components/StoryPlayer";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = getStory(id);
  if (!story) notFound();
  return <StoryPlayer story={story} />;
}
