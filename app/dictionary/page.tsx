"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const words = [
  {
    term: "3BET",
    category: "プリフロップ",
    description:
      "誰かがレイズした後、さらにレイズすること。強いハンドだけでなくブラフでも使われます。"
  },
  {
    term: "4BET",
    category: "プリフロップ",
    description:
      "3BETに対してさらにレイズすること。AAやKKなど超強いハンドが多いです。"
  },
  {
    term: "レンジ",
    category: "基本",
    description:
      "相手が持っている可能性のあるハンド全体のこと。"
  },
  {
    term: "ポットオッズ",
    category: "基本",
    description:
      "コールする価値があるか判断するための勝率計算。"
  },
  {
    term: "C-BET",
    category: "フロップ",
    description:
      "プリフロップでレイズした人がフロップでも続けてベットすること。"
  },
  {
    term: "バリュー",
    category: "ベット",
    description:
      "弱いハンドからコールをもらうためのベット。"
  },
  {
    term: "ブラフ",
    category: "ベット",
    description:
      "弱いハンドで相手を降ろすためにベットすること。"
  },
  {
    term: "エクイティ",
    category: "基本",
    description:
      "現在の勝率のこと。"
  },
  {
    term: "ナッツ",
    category: "基本",
    description:
      "その場面で作れる最強ハンド。"
  },
  {
    term: "ショーダウン",
    category: "基本",
    description:
      "最後にカードを公開して勝敗を決めること。"
  }
];

export default function DictionaryPage() {
  const [search, setSearch] = useState("");

  const result = useMemo(() => {
    return words.filter((w) =>
      w.term.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <main className="min-h-screen bg-[#08120f] text-white px-5 py-8">

      <Link href="/" className="text-green-400">
        ← ホームへ戻る
      </Link>

      <h1 className="text-4xl font-black mt-5">
        ポーカー用語辞典
      </h1>

      <p className="text-white/70 mt-2">
        分からない用語を検索できます。
      </p>

      <input
        className="w-full mt-6 rounded-xl bg-zinc-900 border border-zinc-700 p-4"
        placeholder="検索（例：3BET）"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-4 mt-6">

        {result.map((item) => (

          <div
            key={item.term}
            className="rounded-2xl border border-green-700 bg-zinc-900 p-5"
          >
            <div className="flex justify-between">

              <h2 className="text-2xl font-bold">
                {item.term}
              </h2>

              <span className="text-green-400">
                {item.category}
              </span>

            </div>

            <p className="mt-4 text-white/80 leading-7">
              {item.description}
            </p>

          </div>

        ))}

      </div>

    </main>
  );
}