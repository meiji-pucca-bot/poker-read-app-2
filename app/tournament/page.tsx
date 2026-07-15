"use client";

import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { useEffect, useState } from "react";

type TournamentHand = {
  id?: string;
  result?: {
    type?: "win" | "lose" | "chop";
  };
};

function readTournamentHands(): TournamentHand[] {
  const saved = localStorage.getItem(
    "poker-read-tournament-hands",
  );

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

type MenuCardProps = {
  href: string;
  title: string;
  englishTitle: string;
  description: string;
  symbol: string;
  className: string;
  disabled?: boolean;
};

function MenuCard({
  href,
  title,
  englishTitle,
  description,
  symbol,
  className,
  disabled = false,
}: MenuCardProps) {
  const content = (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 ${className} ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "active:scale-[0.98]"
      }`}
    >
      <span className="absolute -right-3 -top-8 text-[110px] font-black opacity-10">
        {symbol}
      </span>

      <div className="relative flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-black/20 text-4xl">
          {symbol}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black tracking-[0.18em] text-white/50">
            {englishTitle}
          </p>

          <h2 className="mt-1 text-2xl font-black">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/65">
            {description}
          </p>
        </div>

        <span className="text-2xl text-white/40">
          ›
        </span>
      </div>
    </div>
  );

  if (disabled) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

export default function TournamentHomePage() {
  const [handCount, setHandCount] = useState(0);
  const [winCount, setWinCount] = useState(0);

  useEffect(() => {
    const hands = readTournamentHands();

    setHandCount(hands.length);

    setWinCount(
      hands.filter(
        (hand) =>
          hand.result?.type === "win",
      ).length,
    );
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120b05] px-4 py-7 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-150px] h-[330px] w-[330px] -translate-x-1/2 rounded-full bg-amber-400/20 blur-3xl" />

        <div className="absolute -left-24 top-1/3 h-60 w-60 rounded-full bg-red-500/10 blur-3xl" />

        <div className="absolute -right-24 bottom-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md">
        <header className="mb-7">
          <Link
            href="/"
            className="text-sm font-bold text-amber-300"
          >
            ← モード選択へ戻る
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-dashed border-amber-200 bg-gradient-to-br from-amber-300 to-amber-600 text-4xl shadow-xl shadow-amber-950/50">
              🏆
            </div>

            <div>
              <p className="text-xs font-black tracking-[0.2em] text-amber-300">
                TOURNAMENT MODE
              </p>

              <h1 className="mt-1 text-3xl font-black">
                トーナメント
              </h1>

              <p className="mt-1 text-sm text-white/50">
                ICM・バブル・スタックを考慮
              </p>
            </div>
          </div>
        </header>

        <section className="mb-5 rounded-3xl border border-amber-700/60 bg-gradient-to-br from-amber-950/80 to-black/40 p-5 shadow-xl">
          <p className="text-xs font-black text-amber-300">
            TOURNAMENT STATUS
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/25 p-4">
              <p className="text-xs text-white/40">
                保存ハンド
              </p>

              <p className="mt-1 text-3xl font-black">
                {handCount}
              </p>
            </div>

            <div className="rounded-2xl bg-black/25 p-4">
              <p className="text-xs text-white/40">
                勝ち
              </p>

              <p className="mt-1 text-3xl font-black text-emerald-300">
                {winCount}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-800/60 bg-amber-950/30 p-4">
            <p className="text-sm font-bold text-amber-200">
              トーナメント版で分析する情報
            </p>

            <p className="mt-2 text-sm leading-7 text-white/60">
              残り人数、入賞人数、順位、BBアンティ、
              有効スタック、バブル、ICMを考慮してAIが振り返ります。
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <MenuCard
            href="/tournament/new-hand"
            title="新規ハンド"
            englishTitle="NEW TOURNAMENT HAND"
            description="大会情報、残り人数、スタック、各アクションを記録します。"
            symbol="♠"
            className="border-emerald-800 bg-gradient-to-br from-emerald-900 to-emerald-950"
          />

          <MenuCard
            href="/tournament/history"
            title="トーナメント履歴"
            englishTitle="TOURNAMENT HISTORY"
            description="トーナメント専用の保存ハンドを確認します。"
            symbol="♣"
            className="border-sky-900 bg-gradient-to-br from-sky-950 to-slate-950"
          />

          <MenuCard
            href="/tournament/review"
            title="AIトーナメントレビュー"
            englishTitle="TOURNAMENT AI REVIEW"
            description="ICMやスタック状況を含めてAIコーチが分析します。"
            symbol="♦"
            className="border-amber-800 bg-gradient-to-br from-amber-950 to-slate-950"
          />
        </section>

        <section className="mt-6 rounded-3xl border border-red-900/60 bg-red-950/20 p-5">
          <p className="text-xs font-black tracking-[0.18em] text-red-300">
            IMPORTANT
          </p>

          <h2 className="mt-2 text-lg font-black">
            キャッシュゲームとは別に保存
          </h2>

          <p className="mt-2 text-sm leading-7 text-white/60">
            トーナメントのハンドは専用領域へ保存します。
            キャッシュゲームの履歴と混ざらないので、別々に復習できます。
          </p>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}