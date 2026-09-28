"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  loadTournamentHistory,
  type FinishedTournament,
} from "@/lib/tournament-storage";

type HomeButtonProps = {
  href: string;
  icon: string;
  label: string;
  description?: string;
  className: string;
};

type ComingSoonCardProps = {
  icon: string;
  title: string;
  description: string;
};

function HomeButton({
  href,
  icon,
  label,
  description,
  className,
}: HomeButtonProps) {
  return (
    <Link
      href={href}
      className={`flex min-h-20 items-center gap-4 rounded-3xl border px-5 py-4 text-left shadow-lg transition hover:brightness-110 active:scale-[0.98] ${className}`}
    >
      <span className="text-3xl" aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-black">{label}</span>
        {description && (
          <span className="mt-1 block text-sm font-medium text-white/60">
            {description}
          </span>
        )}
      </span>
      <span className="shrink-0 text-2xl text-white/45" aria-hidden="true">›</span>
    </Link>
  );
}

function ComingSoonCard({
  icon,
  title,
  description,
}: ComingSoonCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">{icon}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-white">{title}</h3>
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-black tracking-wider text-white/40">
              COMING SOON
            </span>
          </div>
          <p className="mt-1 text-xs font-medium leading-5 text-white/40">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatBb(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 1,
  }).format(value);
}

export default function Home() {
  const [history, setHistory] = useState<FinishedTournament[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  useEffect(() => {
    setHistory(loadTournamentHistory());
    setIsHistoryLoaded(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(40px,calc(env(safe-area-inset-top)+16px))] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-160px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -left-28 top-1/2 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -right-28 bottom-10 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md">
        <header className="text-center">
          <p className="text-xs font-black tracking-[0.28em] text-emerald-300/70">
            POKER LEARNING APP
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Poker <span className="text-emerald-400">Read</span>
          </h1>

          <div className="mx-auto mt-5 flex h-52 w-52 items-center justify-center overflow-hidden rounded-full border border-emerald-400/30 bg-emerald-950/60 shadow-2xl shadow-emerald-950/60">
            <Image
              src="/icon-512.png"
              alt="KBキャラクター"
              width={208}
              height={208}
              priority
              className="h-full w-full object-cover"
            />
          </div>

          <div className="relative mx-auto mt-4 max-w-sm rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-xl">
            <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-white/10 bg-[#102219]" />
            <p className="relative text-base font-bold leading-7 text-slate-100">
              「今日は何をチェックする？」
            </p>
          </div>
        </header>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <section>
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="text-xl" aria-hidden="true">🃏</span>
            <div>
              <h2 className="font-black text-white">ハンド解析</h2>
              <p className="text-xs text-white/45">プレイしたハンドを振り返る</p>
            </div>
          </div>

          <div className="space-y-4">
            <HomeButton
              href="/cash"
              icon="💵"
              label="キャッシュゲーム"
              description="リングゲームのハンドを解析"
              className="border-emerald-700/70 bg-gradient-to-br from-emerald-900 to-emerald-950"
            />
            <HomeButton
              href="/tournament"
              icon="🏆"
              label="トーナメント"
              description="大会でプレイしたハンドを解析"
              className="border-amber-700/70 bg-gradient-to-br from-amber-950 to-slate-950"
            />
          </div>
        </section>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <section>
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="text-xl" aria-hidden="true">🧠</span>
            <div>
              <h2 className="font-black text-white">トーナメントサポート</h2>
              <p className="text-xs text-white/45">大会中の判断と終了後の成績を確認</p>
            </div>
          </div>

          <div className="space-y-4">
            <HomeButton
              href="/tournament-navi"
              icon="🧠"
              label="Tournament Navi"
              description="現在のスタックから今やることを診断"
              className="border-violet-700/70 bg-gradient-to-br from-violet-950 to-slate-950"
            />
            <HomeButton
              href="/stats"
              icon="📊"
              label="成績"
              description="大会履歴・統計を見る"
              className="border-cyan-700/70 bg-gradient-to-br from-cyan-950 to-slate-950"
            />

            <HomeButton
              href="/tournament-ai-review"
              icon="🤖"
              label="AI大会レビュー"
              description="大会履歴から傾向と次回の課題を分析"
              className="border-fuchsia-700/70 bg-gradient-to-br from-fuchsia-950 to-slate-950"
            />

            <HomeButton
              href="/ocr"
              icon="📷"
              label="大会スクショ読込"
              description="画像から大会情報を自動入力"
              className="border-violet-700/70 bg-gradient-to-br from-violet-950 to-slate-950"
            />

            <HomeButton
              href="/calculator"
              icon="🧮"
              label="Poker Calculator"
              description="ポットオッズとエクイティを計算"
              className="border-emerald-700/70 bg-gradient-to-br from-emerald-950 to-slate-950"
            />

            <HomeButton
              href="/vpip"
              icon="📊"
              label="VPIP / PFR Tracker"
              description="毎ハンド1タップで参加率を記録"
              className="border-amber-700/70 bg-gradient-to-br from-amber-950 to-slate-950"
            />

          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.16em] text-violet-300">
                RECENT RESULTS
              </p>
              <h2 className="mt-1 text-lg font-black">最近の大会</h2>
            </div>
            <Link
              href="/stats"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/50 transition hover:bg-white/10"
            >
              成績を見る
            </Link>
          </div>

          {!isHistoryLoaded ? (
            <p className="mt-4 text-sm font-medium text-white/35">
              大会履歴を読み込んでいます。
            </p>
          ) : history.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-center">
              <p className="text-sm font-bold text-white/45">
                まだ大会履歴がありません
              </p>
              <p className="mt-1 text-xs leading-5 text-white/30">
                Tournament Naviで大会を終了すると、ここに表示されます。
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {history.slice(0, 3).map((tournament) => (
                <article
                  key={tournament.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/15 bg-amber-300/10 text-xl">
                    🏆
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-black">
                      {tournament.form.tournamentName.trim() || "名称未入力の大会"}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-white/35">
                      {formatDate(tournament.finishedAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                    {tournament.finalHeroBb > 0
                      ? `${formatBb(tournament.finalHeroBb)} BB`
                      : "未計算"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <HomeButton
          href="/dictionary"
          icon="📖"
          label="ポーカー用語辞典"
          description="分からない用語を調べる"
          className="border-sky-800/70 bg-gradient-to-br from-sky-950 to-slate-950"
        />

        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="text-xl" aria-hidden="true">🚧</span>
            <div>
              <h2 className="font-black text-white">Coming Soon</h2>
              <p className="text-xs text-white/45">今後追加予定の機能</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ComingSoonCard
              icon="📈"
              title="グラフ"
              description="大会履歴と成績の推移を見える化"
            />
            <ComingSoonCard
              icon="🤖"
              title="AI分析"
              description="プレイ傾向と次の改善点を診断"
            />
            <ComingSoonCard
              icon="🌐"
              title="URL読込"
              description="大会ページのURLから情報を取得"
            />
          </div>
        </section>

        <p className="mt-8 text-center text-[10px] font-bold tracking-[0.18em] text-white/20">
          POKER READ
        </p>
      </div>
    </main>
  );
}
