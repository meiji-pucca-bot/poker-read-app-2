"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loadTournamentHistory,
  type FinishedTournament,
} from "@/lib/tournament-storage";
import {
  clearTournamentReviewCache,
  createTournamentHistorySignature,
  readTournamentReviewCache,
  saveTournamentReviewCache,
  type TournamentAiReview,
} from "@/lib/tournament-review";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ReviewList({
  items,
  marker,
}: {
  items: string[];
  marker: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
        >
          <span
            className="shrink-0 text-lg"
            aria-hidden="true"
          >
            {marker}
          </span>
          <p className="text-sm font-medium leading-6 text-white/75">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function TournamentAiReviewPage() {
  const [history, setHistory] = useState<
    FinishedTournament[]
  >([]);
  const [review, setReview] = useState<
    TournamentAiReview | null
  >(null);
  const [isLoaded, setIsLoaded] =
    useState(false);
  const [isGenerating, setIsGenerating] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadedHistory =
      loadTournamentHistory();
    const signature =
      createTournamentHistorySignature(
        loadedHistory,
      );
    const cache =
      readTournamentReviewCache();

    setHistory(loadedHistory);

    if (
      cache &&
      cache.historySignature === signature
    ) {
      setReview(cache.review);
    }

    setIsLoaded(true);
  }, []);

  const historySignature = useMemo(
    () =>
      createTournamentHistorySignature(
        history,
      ),
    [history],
  );

  async function generateReview() {
    if (history.length === 0) {
      setError(
        "レビューする大会履歴がありません。",
      );
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch(
        "/api/tournament-review",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            tournaments: history.slice(0, 30),
          }),
        },
      );

      const data =
        (await response.json()) as {
          review?: TournamentAiReview;
          error?: string;
        };

      if (!response.ok || !data.review) {
        throw new Error(
          data.error ||
            "AIレビューを生成できませんでした。",
        );
      }

      setReview(data.review);
      saveTournamentReviewCache({
        historySignature,
        review: data.review,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "AIレビューを生成できませんでした。",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function deleteReview() {
    clearTournamentReviewCache();
    setReview(null);
    setError("");
  }

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07150f] px-4 text-white">
        <div className="text-center">
          <div className="text-4xl">🤖</div>
          <p className="mt-4 font-black">
            大会履歴を読み込んでいます
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-4 pb-[max(40px,env(safe-area-inset-bottom))] pt-[max(24px,calc(env(safe-area-inset-top)+12px))] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl">
        <header>
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-white/55 transition hover:bg-white/[0.08]"
          >
            ‹ HOME
          </Link>

          <p className="mt-6 text-xs font-black tracking-[0.2em] text-violet-300">
            AI TOURNAMENT COACH
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            🤖 AI大会レビュー
          </h1>

          <p className="mt-3 text-sm font-medium leading-6 text-white/45">
            保存された大会履歴から、傾向・改善点・次回の課題を整理します。
          </p>
        </header>

        <section className="mt-6 rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-400/[0.1] to-transparent p-5 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.16em] text-violet-300">
                REVIEW DATA
              </p>
              <p className="mt-2 text-2xl font-black">
                {history.length}大会
              </p>
            </div>

            <Link
              href="/stats"
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-black text-white/55"
            >
              成績を見る
            </Link>
          </div>

          <p className="mt-4 text-xs font-medium leading-5 text-white/35">
            最大30大会をAIへ送信します。順位・賞金・ハンド内容など、
            保存されていない情報は分析できません。
          </p>
        </section>

        {history.length === 0 ? (
          <section className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center">
            <div className="text-5xl">🏆</div>
            <h2 className="mt-5 text-xl font-black">
              大会履歴がありません
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-white/45">
              Tournament Naviで大会を終了すると、
              AIレビューを作成できます。
            </p>
            <Link
              href="/tournament-navi"
              className="mt-6 inline-flex rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-[#07150f]"
            >
              Tournament Naviを開く
            </Link>
          </section>
        ) : (
          <>
            <button
              type="button"
              onClick={generateReview}
              disabled={isGenerating}
              className="mt-5 w-full rounded-3xl bg-gradient-to-r from-violet-400 to-emerald-300 px-5 py-5 text-lg font-black text-[#07150f] shadow-xl transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating
                ? "AIが大会履歴を分析中..."
                : review
                  ? "AIレビューを再生成"
                  : "AIレビューを生成"}
            </button>

            {review && (
              <p className="mt-2 text-center text-xs text-white/35">
                履歴が変わらない限り、保存済みレビューを再表示します。
              </p>
            )}

            {isGenerating && (
              <section className="mt-5 rounded-3xl border border-violet-300/15 bg-violet-400/[0.07] p-6 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/15 border-t-violet-300" />
                <p className="mt-4 font-black">
                  傾向と次回の課題を整理しています
                </p>
              </section>
            )}

            {error && (
              <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-medium leading-6 text-red-200">
                {error}
              </p>
            )}

            {review && (
              <div className="mt-6 space-y-5">
                <section className="rounded-[32px] border border-violet-300/20 bg-gradient-to-br from-violet-950 via-slate-950 to-emerald-950 p-6 shadow-2xl">
                  <p className="text-center text-xs font-black tracking-[0.2em] text-violet-300">
                    OVERALL REVIEW
                  </p>

                  <div className="mt-5 flex items-end justify-center gap-7">
                    <div className="text-center">
                      <p className="text-6xl font-black">
                        {review.score}
                      </p>
                      <p className="mt-1 text-xs text-white/35">
                        100点満点
                      </p>
                    </div>

                    <p className="text-7xl font-black text-emerald-300">
                      {review.grade}
                    </p>
                  </div>

                  <h2 className="mt-6 text-center text-xl font-black">
                    {review.headline}
                  </h2>

                  <p className="mt-4 text-center text-sm font-medium leading-7 text-white/65">
                    {review.summary}
                  </p>
                </section>

                <section className="rounded-3xl border border-emerald-300/15 bg-emerald-400/[0.06] p-5">
                  <h2 className="text-lg font-black text-emerald-300">
                    🟢 良い傾向
                  </h2>
                  <div className="mt-4">
                    <ReviewList
                      items={review.strengths}
                      marker="✓"
                    />
                  </div>
                </section>

                <section className="rounded-3xl border border-amber-300/15 bg-amber-400/[0.06] p-5">
                  <h2 className="text-lg font-black text-amber-200">
                    🟡 改善ポイント
                  </h2>
                  <div className="mt-4">
                    <ReviewList
                      items={review.improvements}
                      marker="!"
                    />
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <article className="rounded-3xl border border-cyan-300/15 bg-cyan-400/[0.06] p-5">
                    <p className="text-xs font-black tracking-[0.15em] text-cyan-300">
                      STACK
                    </p>
                    <h2 className="mt-2 font-black">
                      スタック面
                    </h2>
                    <p className="mt-3 text-sm font-medium leading-7 text-white/60">
                      {review.stackAdvice}
                    </p>
                  </article>

                  <article className="rounded-3xl border border-amber-300/15 bg-amber-400/[0.06] p-5">
                    <p className="text-xs font-black tracking-[0.15em] text-amber-200">
                      ITM
                    </p>
                    <h2 className="mt-2 font-black">
                      入賞面
                    </h2>
                    <p className="mt-3 text-sm font-medium leading-7 text-white/60">
                      {review.itmAdvice}
                    </p>
                  </article>
                </section>

                <section className="rounded-3xl border border-sky-300/15 bg-sky-400/[0.06] p-5">
                  <h2 className="text-lg font-black text-sky-300">
                    📈 データから見える傾向
                  </h2>
                  <p className="mt-3 text-sm font-medium leading-7 text-white/65">
                    {review.trend}
                  </p>
                </section>

                <section className="rounded-3xl border border-violet-300/15 bg-violet-400/[0.06] p-5">
                  <h2 className="text-lg font-black text-violet-300">
                    🎯 次回の課題
                  </h2>
                  <div className="mt-4">
                    <ReviewList
                      items={review.nextGoals}
                      marker="→"
                    />
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs font-black tracking-[0.15em] text-white/40">
                    AI COACH MESSAGE
                  </p>
                  <p className="mt-3 text-sm font-medium leading-7 text-white/70">
                    {review.finalMessage}
                  </p>
                </section>

                <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <h2 className="text-sm font-black text-white/55">
                    分析上の注意
                  </h2>
                  <div className="mt-3">
                    <ReviewList
                      items={review.dataNotes}
                      marker="※"
                    />
                  </div>
                  <p className="mt-4 text-xs font-medium text-white/25">
                    生成日時: {formatDate(review.generatedAt)}
                  </p>
                </section>

                <button
                  type="button"
                  onClick={deleteReview}
                  className="w-full rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm font-black text-red-300"
                >
                  保存済みレビューを削除
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
