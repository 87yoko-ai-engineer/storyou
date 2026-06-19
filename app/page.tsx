// app/page.tsx
// トップ画面。ストーリー一覧を表示し、選ぶと再生画面へ。

import Link from "next/link";
import { ALL_STORIES } from "@/content";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-md px-5 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Storyou</h1>
      <p className="mb-8 mt-1 text-sm text-gray-500">あなたが主人公の英会話ストーリー。</p>

      <ul className="space-y-3">
        {ALL_STORIES.map((s) => (
          <li key={s.id}>
            <Link
              href={`/story/${s.id}`}
              className="block rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="text-lg font-semibold text-gray-900">{s.title}</div>
              <div className="mt-1 text-sm text-gray-500">{s.turns.length} セリフ</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
