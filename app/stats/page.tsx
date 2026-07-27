"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import StatCard from "@/components/StatCard";
import {
  HeroBbChart,
  ProgressChart,
} from "@/components/TournamentCharts";
import {
  loadTournamentHistory,
  type FinishedTournament,
} from "@/lib/tournament-storage";
import {
  calculateTournamentStats,
  createHeroBbChartData,
  formatStatNumber,
  formatYen,
  isEstimatedItm,
} from "@/lib/stats";

export default function StatsPage() {
  const [history, setHistory] = useState<
    FinishedTournament[]
  >([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHistory(loadTournamentHistory());
    setIsLoaded(true);
  }, []);

  const stats = useMemo(
    () => calculateTournamentStats(history),
    [history],
  );

  const chartData = useMemo(
    () => createHeroBbChartData(history),
    [history],
  );

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07150f] px-4 text-white">
        <div className="text-center">
          <div className="text-4xl">📊</div>
          <p className="mt-4 font-black">
            成績を集計しています
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-4 pb-[max(40px,env(safe-area-inset-bottom))] pt-[max(24px,calc(env(safe-area-inset-top)+12px))] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-28 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -left-28 top-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/55 transition hover:bg-white/[0.08]"
            >
              ‹ HOME
            </Link>

            <p className="mt-6 text-xs font-black tracking-[0.2em] text-emerald-300">
              TOURNAMENT STATS
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              📊 成績
            </h1>

            <p className="mt-2 text-sm font-medium leading-6 text-white/45">
              Tournament Naviの大会履歴から自動集計します。
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-right">
            <p className="text-[10px] font-black tracking-[0.15em] text-emerald-300/70">
              HISTORY
            </p>
            <p className="mt-1 text-xl font-black text-emerald-200">
              {history.length}件
            </p>
          </div>
        </header>

        {history.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center">
            <div className="text-5xl">🏆</div>

            <h2 className="mt-5 text-xl font-black">
              まだ大会履歴がありません
            </h2>

            <p className="mt-3 text-sm font-medium leading-6 text-white/45">
              Tournament Naviで大会を終了すると、
              <br />
              ここへ成績とグラフが自動反映されます。
            </p>

            <Link
              href="/tournament-navi"
              className="mt-6 inline-flex rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-[#07150f] transition hover:bg-emerald-300"
            >
              Tournament Naviを開く
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard
                icon="🏆"
                label="総大会数"
                value={`${stats.totalTournaments}回`}
              />

              <StatCard
                icon="💰"
                label="推定ITM率"
                value={`${formatStatNumber(
                  stats.estimatedItmRate,
                )}%`}
                note={`${stats.estimatedItmCount}回 / ${stats.totalTournaments}回`}
              />

              <StatCard
                icon="🪙"
                label="平均終了BB"
                value={`${formatStatNumber(
                  stats.averageFinalHeroBb,
                )} BB`}
              />

              <StatCard
                icon="🚀"
                label="最高終了BB"
                value={`${formatStatNumber(
                  stats.bestFinalHeroBb,
                )} BB`}
              />

              <StatCard
                icon="👥"
                label="平均参加人数"
                value={`${formatStatNumber(
                  stats.averageStartingPlayers,
                  0,
                )}人`}
              />

              <StatCard
                icon="🎟️"
                label="平均バイイン"
                value={formatYen(stats.averageBuyIn)}
              />

              <StatCard
                icon="🧾"
                label="総バイイン"
                value={formatYen(stats.totalBuyIn)}
              />

              <StatCard
                icon="🆕"
                label="最新終了BB"
                value={`${formatStatNumber(
                  stats.latestFinalHeroBb,
                )} BB`}
              />
            </section>

            <div className="mt-6">
              <HeroBbChart data={chartData} />
            </div>

            <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProgressChart
                icon="💰"
                label="推定ITM率"
                value={stats.estimatedItmRate}
                displayValue={`${formatStatNumber(
                  stats.estimatedItmRate,
                )}%`}
                note={`${stats.estimatedItmCount}回が推定ITM`}
              />

              <ProgressChart
                icon="🏆"
                label="大会記録"
                value={Math.min(
                  stats.totalTournaments,
                  100,
                )}
                displayValue={`${stats.totalTournaments}回`}
                note="100大会をひとつの記録目標として表示"
              />
            </section>

            <section className="mt-6 rounded-3xl border border-amber-300/15 bg-amber-300/[0.06] p-5">
              <h2 className="font-black text-amber-200">
                推定ITM率について
              </h2>

              <p className="mt-2 text-xs font-medium leading-6 text-white/45">
                大会終了時の「残り人数」が「ITM人数」以下だった大会を、
                ITMとして集計しています。順位や賞金が未入力のため、
                現時点では推定値です。
              </p>
            </section>

            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black tracking-[0.15em] text-violet-300">
                    RECENT RESULTS
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    最近の大会
                  </h2>
                </div>

                <Link
                  href="/tournament-navi"
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/55 transition hover:bg-white/10"
                >
                  Naviを開く
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {history.slice(0, 8).map((tournament) => {
                  const itm = isEstimatedItm(tournament);

                  return (
                    <article
                      key={tournament.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-black">
                              {tournament.form.tournamentName.trim() ||
                                "名称未入力の大会"}
                            </h3>

                            {itm && (
                              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[10px] font-black text-amber-200">
                                ITM
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs font-bold text-white/35">
                            {new Intl.DateTimeFormat(
                              "ja-JP",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            ).format(
                              new Date(
                                tournament.finishedAt,
                              ),
                            )}
                          </p>

                          <p className="mt-2 text-xs font-medium text-white/30">
                            バイイン{" "}
                            {tournament.form.buyIn.trim()
                              ? formatYen(
                                  Number(
                                    tournament.form.buyIn
                                      .replace(/,/g, "")
                                      .replace(
                                        /[^\d.-]/g,
                                        "",
                                      ),
                                  ) || 0,
                                )
                              : "未入力"}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                          {formatStatNumber(
                            tournament.finalHeroBb,
                          )}{" "}
                          BB
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
