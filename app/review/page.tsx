"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import { type StreetKey, type StreetReview } from "@/lib/hand-review-storage";
import { useHandReview } from "@/lib/use-hand-review";

type Action = {
  id?: string;
  position?: string;
  role?: "hero" | "villain";
  actor?: "hero" | "villain";
  action?: string;
  amount?: string;
  addedAmount?: number;
  potBefore?: number;
  potPercent?: number | null;
};

type Street = {
  startingPot?: number;
  endingPot?: number;
  actions?: Action[];
};

type StoredHand = {
  id?: string;
  savedAt?: string;

  table?: {
    smallBlind?: string;
    bigBlind?: string;
    heroStack?: string;
  };

  heroHand?: {
    notation?: string;
  };

  positions?: {
    heroPosition?: string;
  };

  preflop?: {
    endingPot?: number;
    actions?: Action[];
  };

  flop?: Street;
  turn?: Street;
  river?: Street;

  result?: {
    type?: "win" | "lose" | "chop";
  };

  [key: string]: unknown;
};

const streetNames: Record<StreetKey, string> = {
  preflop: "プリフロップ",
  flop: "フロップ",
  turn: "ターン",
  river: "リバー",
};

const actionNames: Record<string, string> = {
  Fold: "フォールド",
  Check: "チェック",
  Limp: "リンプ",
  Call: "コール",
  Open: "オープン",
  "3BET": "3ベット",
  "4BET": "4ベット",
  "5BET": "5ベット",
  Bet: "ベット",
  Raise: "レイズ",
  "All-in": "オールイン",
};

function readHands(): StoredHand[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem("poker-read-hands") ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function resultText(type?: string) {
  if (type === "win") {
    return "勝ち";
  }

  if (type === "lose") {
    return "負け";
  }

  if (type === "chop") {
    return "チョップ";
  }

  return "結果不明";
}

function formatNumber(
  value?: string | number,
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return value ?? "不明";
  }

  return number.toLocaleString("ja-JP");
}

function actionText(action?: string) {
  if (!action) {
    return "不明";
  }

  return Object.hasOwn(actionNames, action) ? actionNames[action] : action;
}

function isHeroAction(
  action: Action,
  heroPosition?: string,
) {
  return (
    action.role === "hero" ||
    action.actor === "hero" ||
    action.position === heroPosition
  );
}

function playerText(
  action: Action,
  heroPosition?: string,
) {
  if (
    isHeroAction(action, heroPosition)
  ) {
    return `自分${
      action.position
        ? `（${action.position}）`
        : ""
    }`;
  }

  return `相手${
    action.position
      ? `（${action.position}）`
      : ""
  }`;
}

function scoreStyle(score: number) {
  if (score >= 85) {
    return {
      text: "text-emerald-300",
      border: "border-emerald-700",
      background:
        "bg-gradient-to-br from-emerald-950 to-slate-950",
    };
  }

  if (score >= 65) {
    return {
      text: "text-sky-300",
      border: "border-sky-800",
      background:
        "bg-gradient-to-br from-sky-950 to-slate-950",
    };
  }

  return {
    text: "text-amber-300",
    border: "border-amber-800",
    background:
      "bg-gradient-to-br from-amber-950 to-slate-950",
  };
}

function BulletList({
  items,
  colorClass,
}: {
  items: string[];
  colorClass: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-white/40">
        特になし
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-start gap-3"
        >
          <span
            className={`mt-1 text-sm ${colorClass}`}
          >
            ●
          </span>

          <p className="text-sm leading-7 text-white/80">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

function ActionTimeline({
  title,
  actions,
  heroPosition,
}: {
  title: string;
  actions?: Action[];
  heroPosition?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div>
          <p className="font-black">
            {title}
          </p>

          <p className="mt-1 text-xs text-white/40">
            {actions?.length ?? 0}
            アクション
          </p>
        </div>

        <span className="text-sm font-bold text-emerald-300">
          {open ? "閉じる ▲" : "流れを見る ▼"}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-white/10 p-4">
          {!actions?.length ? (
            <p className="text-sm text-white/40">
              アクションなし
            </p>
          ) : (
            actions.map((action, index) => {
              const hero =
                isHeroAction(
                  action,
                  heroPosition,
                );

              return (
                <article
                  key={
                    action.id ??
                    `${title}-${index}`
                  }
                  className={`rounded-2xl border p-4 ${
                    hero
                      ? "border-emerald-800 bg-emerald-950/30"
                      : "border-sky-900 bg-sky-950/30"
                  }`}
                >
                  <p
                    className={`text-xs font-black ${
                      hero
                        ? "text-emerald-300"
                        : "text-sky-300"
                    }`}
                  >
                    {index + 1}.{" "}
                    {playerText(
                      action,
                      heroPosition,
                    )}
                  </p>

                  <p className="mt-2 text-lg font-black">
                    {actionText(
                      action.action,
                    )}
                  </p>

                  {(action.amount ||
                    action.addedAmount) && (
                    <div className="mt-3 rounded-xl bg-black/20 p-3 text-sm text-white/70">
                      {action.amount && (
                        <p>
                          最終投入額：
                          <span className="font-bold text-white">
                            {formatNumber(
                              action.amount,
                            )}
                          </span>
                        </p>
                      )}

                      {typeof action.addedAmount ===
                        "number" &&
                        action.addedAmount >
                          0 && (
                          <p className="mt-1">
                            今回の追加：
                            <span className="font-bold text-white">
                              {formatNumber(
                                action.addedAmount,
                              )}
                            </span>
                          </p>
                        )}

                      {typeof action.potPercent ===
                        "number" && (
                        <p className="mt-1">
                          ポット比：
                          <span className="font-bold text-white">
                            {Math.round(
                              action.potPercent,
                            )}
                            % Pot
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}

function StreetReviewCard({
  streetKey,
  review,
  open,
  onToggle,
}: {
  streetKey: StreetKey;
  review: StreetReview;
  open: boolean;
  onToggle: () => void;
}) {
  const style = scoreStyle(review.score ?? 0);

  return (
    <article
      className={`overflow-hidden rounded-3xl border ${style.border} ${style.background}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 text-left"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xl font-black">
              {streetNames[streetKey]}
            </p>

            <p className="mt-1 text-sm text-white/50">
              {review.verdict}
            </p>
          </div>

          <div className="text-right">
            <p
              className={`text-4xl font-black ${style.text}`}
            >
              {review.score ?? "—"}
            </p>

            <p className="mt-1 text-xs text-white/40">
              {open
                ? "閉じる ▲"
                : "詳細を見る ▼"}
            </p>
          </div>
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-white/10 p-5">
          <div className="rounded-2xl bg-black/20 p-4">
            <p className="text-xs font-black text-white/40">
              あなたのアクション
            </p>

            <p className="mt-2 font-bold">
              {review.heroAction}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-800 bg-emerald-950/30 p-4">
            <p className="text-xs font-black text-emerald-300">
              AIのおすすめ
            </p>

            <p className="mt-2 font-bold text-emerald-100">
              {review.recommendedAction}
            </p>
          </div>

          <section>
            <p className="mb-3 font-black text-emerald-300">
              良かった点
            </p>

            <BulletList
              items={review.goodPoints}
              colorClass="text-emerald-400"
            />
          </section>

          <section>
            <p className="mb-3 font-black text-amber-300">
              改善点
            </p>

            <BulletList
              items={
                review.improvementPoints
              }
              colorClass="text-amber-400"
            />
          </section>

          <div className="rounded-2xl bg-black/20 p-4">
            <p className="text-xs font-black text-white/40">
              初心者向け解説
            </p>

            <p className="mt-2 text-sm leading-7 text-white/70">
              {review.detail}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const handIdFromUrl = searchParams.get("handId");
  const [hands, setHands] =
    useState<StoredHand[]>([]);

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const [openStreet, setOpenStreet] =
    useState<StreetKey | null>(
      "preflop",
    );

  useEffect(() => {
    const loadedHands = readHands();
    // Load browser-only history after hydration; never rewrite existing hand records.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHands(loadedHands);
    setSelectedIndex(handIdFromUrl
      ? loadedHands.findIndex((hand) => hand.id === handIdFromUrl)
      : 0);
  }, [handIdFromUrl]);

  const selectedHand =
    hands[selectedIndex];

  const { review, saved, error, saveError, loading, generateReview, retrySave, deleteCachedReview } =
    useHandReview("cash", selectedHand);

  const actionGroups = useMemo(
    () => [
      {
        title: "プリフロップ",
        actions:
          selectedHand?.preflop
            ?.actions,
      },
      {
        title: "フロップ",
        actions:
          selectedHand?.flop
            ?.actions,
      },
      {
        title: "ターン",
        actions:
          selectedHand?.turn
            ?.actions,
      },
      {
        title: "リバー",
        actions:
          selectedHand?.river
            ?.actions,
      },
    ],
    [selectedHand],
  );

  return (
    <main className="min-h-screen bg-[#07150f] px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[calc(env(safe-area-inset-top)+28px)] text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link
            href="/"
            className="text-sm font-bold text-emerald-300"
          >
            ← ホームへ戻る
          </Link>

          <p className="mt-6 text-xs font-black tracking-[0.2em] text-amber-300">
            ♦ AI HAND REVIEW
          </p>

          <h1 className="mt-2 text-3xl font-black">
            AIハンドレビュー
          </h1>

          <p className="mt-2 text-sm leading-7 text-white/60">
            全アクションを確認しながら、
            良かった点と改善点を短く整理します。
          </p>

          <div className="mt-5 flex items-center gap-4 rounded-3xl border border-emerald-800/70 bg-emerald-950/30 p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/5">
              <Image
                src="/icon-512.png"
                alt="KBキャラクター"
                fill
                sizes="80px"
                className="object-contain"
                priority
              />
            </div>

            <div>
              <p className="text-xs font-black tracking-[0.16em] text-emerald-300">
                KB COACH
              </p>
              <p className="mt-1 text-sm font-bold leading-6 text-white/90">
                勝ち負けではなく、判断の内容を一緒に振り返ろう！
              </p>
            </div>
          </div>
        </header>

        {hands.length === 0 ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="font-black">
              保存したハンドがありません
            </p>

            <Link
              href="/new-hand"
              className="mt-5 block rounded-2xl bg-emerald-400 p-4 font-black text-slate-950"
            >
              新しいハンドを記録
            </Link>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <label
                htmlFor="hand-select"
                className="font-black"
              >
                レビューするハンド
              </label>

              <select
                id="hand-select"
                value={selectedIndex}
                disabled={loading}
                onChange={(event) => {
                  setSelectedIndex(
                    Number(
                      event.target.value,
                    ),
                  );
                }}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                {!selectedHand && <option value={-1}>指定されたハンドが見つかりません</option>}
                {hands.map(
                  (hand, index) => (
                    <option
                      key={
                        hand.id ??
                        index
                      }
                      value={index}
                    >
                      {hand.heroHand
                        ?.notation ??
                        "ハンド不明"}
                      {" / "}
                      {hand.positions
                        ?.heroPosition ??
                        "位置不明"}
                      {" / "}
                      {resultText(
                        hand.result?.type,
                      )}
                    </option>
                  ),
                )}
              </select>
            </section>

            <section className="mt-4 rounded-3xl border border-sky-900 bg-sky-950/20 p-5">
              <p className="text-xs font-black text-sky-300">
                保存されたアクション
              </p>

              <div className="mt-4 space-y-3">
                {actionGroups.map(
                  (group) => (
                    <ActionTimeline
                      key={group.title}
                      title={group.title}
                      actions={
                        group.actions
                      }
                      heroPosition={
                        selectedHand
                          ?.positions
                          ?.heroPosition
                      }
                    />
                  ),
                )}
              </div>
            </section>

            <button
              type="button"
              onClick={() => { setOpenStreet("preflop"); void generateReview(); }}
              disabled={loading || !selectedHand}
              className="mt-4 w-full rounded-3xl bg-gradient-to-r from-emerald-400 to-lime-300 p-5 text-lg font-black text-slate-950 shadow-lg shadow-emerald-950/50 disabled:bg-slate-700"
            >
              {loading
                ? "AIが分析しています..."
                : review
                  ? "AIレビューを再生成"
                  : "AIレビューを生成"}
            </button>

            {review && saved && (
              <p className="mt-2 text-center text-xs text-white/40">
                保存済みレビューを表示中です。表示だけではAIを呼び出しません。
              </p>
            )}

            {review?.legacy && (
              <p className="mt-2 text-sm text-amber-200">旧形式の保存済みレビューです。記録のない項目は「記録なし」と表示します。</p>
            )}

            {saveError && (
              <section role="alert" className="mt-4 rounded-2xl border border-amber-700 bg-amber-950/40 p-4 text-sm text-amber-100">
                <p>{saveError}</p>
                <button type="button" onClick={retrySave} disabled={loading} className="mt-3 w-full rounded-xl bg-amber-300 p-3 font-bold text-amber-950 disabled:opacity-50">
                  保存だけ再試行（AIを呼び出しません）
                </button>
              </section>
            )}

            {loading && (
              <section className="mt-4 rounded-3xl border border-emerald-800 bg-emerald-950/30 p-6 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-emerald-300" />

                <p className="mt-4 font-black">
                  ハンドを分析中
                </p>
              </section>
            )}

            {error && (
              <p className="mt-4 rounded-2xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
                {error}
              </p>
            )}

            {review && (
              <>
                <section className="mt-5 rounded-[32px] border border-amber-700 bg-gradient-to-br from-amber-950 via-slate-950 to-emerald-950 p-6 shadow-xl">
                  <p className="text-center text-xs font-black tracking-[0.2em] text-amber-300">
                    OVERALL SCORE
                  </p>

                  <div className="mt-4 flex items-end justify-center gap-6">
                    <div className="text-center">
                      <p className="text-6xl font-black">
                        {review.totalScore}
                      </p>

                      <p className="mt-1 text-xs text-white/40">
                        100点満点
                      </p>
                    </div>

                    <p className="text-6xl font-black text-amber-300">
                      {review.grade}
                    </p>
                  </div>

                  <p className="mt-5 text-center text-3xl text-amber-300">
                    {"★".repeat(
                      review.stars,
                    )}
                    {"☆".repeat(
                      5 -
                        review.stars,
                    )}
                  </p>

                  <p className="mt-5 text-center text-sm leading-7 text-white/75">
                    {
                      review.shortSummary
                    }
                  </p>
                </section>

                <section className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-emerald-800 bg-emerald-950/30 p-4">
                    <p className="text-xs font-black text-emerald-300">
                      一番良かった
                    </p>

                    <p className="mt-2 text-sm leading-6">
                      {
                        review.strongestStreet
                      }
                    </p>
                  </div>

                  <div className="rounded-3xl border border-amber-800 bg-amber-950/30 p-4">
                    <p className="text-xs font-black text-amber-300">
                      最大の課題
                    </p>

                    <p className="mt-2 text-sm leading-6">
                      {review.mainLeak}
                    </p>
                  </div>
                </section>

                <section className="mt-4 rounded-3xl border border-emerald-800 bg-emerald-950/20 p-5">
                  <h2 className="text-lg font-black text-emerald-300">
                    🟢 良かった点
                  </h2>

                  <div className="mt-4">
                    <BulletList
                      items={
                        review.goodPoints
                      }
                      colorClass="text-emerald-400"
                    />
                  </div>
                </section>

                <section className="mt-4 rounded-3xl border border-amber-800 bg-amber-950/20 p-5">
                  <h2 className="text-lg font-black text-amber-300">
                    🟡 改善点
                  </h2>

                  <div className="mt-4">
                    <BulletList
                      items={
                        review.improvementPoints
                      }
                      colorClass="text-amber-400"
                    />
                  </div>
                </section>

                <section className="mt-6">
                  <h2 className="text-xl font-black">
                    ストリート別レビュー
                  </h2>

                  <p className="mt-1 text-sm text-white/50">
                    必要な場所だけ開いて確認できます。
                  </p>

                  <div className="mt-4 space-y-3">
                    {(
                      Object.keys(
                        review.streets,
                      ) as StreetKey[]
                    ).map(
                      (streetKey) => (
                        <StreetReviewCard
                          key={
                            streetKey
                          }
                          streetKey={
                            streetKey
                          }
                          review={
                            review
                              .streets[
                              streetKey
                            ]
                          }
                          open={
                            openStreet ===
                            streetKey
                          }
                          onToggle={() =>
                            setOpenStreet(
                              openStreet ===
                                streetKey
                                ? null
                                : streetKey,
                            )
                          }
                        />
                      ),
                    )}
                  </div>
                </section>

                <section className="mt-5 rounded-3xl border border-sky-800 bg-sky-950/20 p-5">
                  <h2 className="text-lg font-black text-sky-300">
                    🎯 次回意識すること
                  </h2>

                  <div className="mt-4">
                    <BulletList
                      items={
                        review.nextGoals
                      }
                      colorClass="text-sky-400"
                    />
                  </div>
                </section>

                <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs font-black text-emerald-300">
                    AI COACHから一言
                  </p>

                  <p className="mt-3 text-sm leading-7 text-white/75">
                    {
                      review.finalMessage
                    }
                  </p>
                </section>

                <button
                  type="button"
                  onClick={deleteCachedReview}
                  disabled={loading}
                  className="mt-4 w-full rounded-2xl border border-red-900 p-4 text-sm font-bold text-red-300"
                >
                  保存済みAIレビューを削除
                </button>
              </>
            )}

            <Link
              href="/history"
              className="mt-6 block w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-center font-black"
            >
              ハンド履歴を見る
            </Link>
          </>
        )}
      </div>

      
    </main>
  );
}
export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#07150f] px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[calc(env(safe-area-inset-top)+28px)] text-white">
          <div className="mx-auto max-w-md">
            <section className="rounded-3xl border border-emerald-800 bg-emerald-950/30 p-6 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-emerald-300" />

              <p className="mt-4 font-black">
                AIレビュー画面を読み込み中
              </p>
            </section>
          </div>
        </main>
      }
    >
      <ReviewPageContent />
    </Suspense>
  );
}