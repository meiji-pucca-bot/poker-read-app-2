"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StoredHand = {
  id?: string;
  savedAt?: string;

  heroHand?: {
    notation?: string;
  };

  positions?: {
    heroPosition?: string;
  };

  result?: {
    type?: "win" | "lose" | "chop";
  };

  [key: string]: unknown;
};

function readHands(): StoredHand[] {
  const saved = localStorage.getItem(
    "poker-read-hands",
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

export default function ReviewPage() {
  const [hands, setHands] =
    useState<StoredHand[]>([]);

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    setHands(readHands());
  }, []);

  const selectedHand = hands[selectedIndex];

  async function generateReview() {
    if (!selectedHand) {
      setError(
        "レビューするハンドがありません。",
      );
      return;
    }

    setLoading(true);
    setError("");
    setReview("");

    try {
      const response = await fetch(
        "/api/review",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            hand: selectedHand,
          }),
        },
      );

      const data = (await response.json()) as {
        review?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AIレビューを生成できませんでした。",
        );
      }

      setReview(data.review ?? "");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "AIレビューを生成できませんでした。",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link
            href="/"
            className="mb-5 inline-block text-sm font-semibold text-slate-400"
          >
            ← ホームへ戻る
          </Link>

          <p className="mb-2 text-sm font-bold text-emerald-400">
            AI HAND REVIEW
          </p>

          <h1 className="text-3xl font-bold">
            AIハンドレビュー
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            保存したハンドの全アクションをAIが振り返ります。
          </p>
        </header>

        {hands.length === 0 ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
            <p className="text-lg font-bold">
              保存したハンドがありません
            </p>

            <Link
              href="/new-hand"
              className="mt-5 block rounded-xl bg-emerald-500 p-4 font-bold text-slate-950"
            >
              新しいハンドを記録
            </Link>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <label
                htmlFor="hand-select"
                className="block font-bold"
              >
                レビューするハンド
              </label>

              <select
                id="hand-select"
                value={selectedIndex}
                onChange={(event) => {
                  setSelectedIndex(
                    Number(event.target.value),
                  );
                  setReview("");
                  setError("");
                }}
                className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-4"
              >
                {hands.map((hand, index) => (
                  <option
                    key={hand.id ?? index}
                    value={index}
                  >
                    {hand.heroHand?.notation ??
                      "ハンド不明"}
                    {" / "}
                    {hand.positions?.heroPosition ??
                      "位置不明"}
                    {" / "}
                    {resultText(
                      hand.result?.type,
                    )}
                  </option>
                ))}
              </select>
            </section>

            <section className="mt-4 rounded-2xl border border-emerald-900 bg-emerald-950/30 p-5">
              <h2 className="font-bold text-emerald-300">
                AIレビューについて
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                プリフロップからリバーまでの全アクション、ベットサイズ、ポジション、スタックをまとめてAIへ送ります。
              </p>

              <button
                type="button"
                onClick={generateReview}
                disabled={loading}
                className="mt-5 w-full rounded-2xl bg-emerald-500 p-5 text-lg font-bold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {loading
                  ? "AIが分析中..."
                  : "AIレビューを生成"}
              </button>
            </section>

            {error && (
              <p className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
                {error}
              </p>
            )}

            {review && (
              <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm font-bold text-emerald-400">
                  AI COACH
                </p>

                <div className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-200">
                  {review}
                </div>
              </section>
            )}

            <Link
              href="/history"
              className="mt-6 block w-full rounded-2xl border border-slate-700 bg-slate-900 p-5 text-center font-bold"
            >
              ハンド履歴を見る
            </Link>
          </>
        )}
      </div>
    </main>
  );
}