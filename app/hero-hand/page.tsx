"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

const suits = [
  { symbol: "♠", name: "スペード", color: "text-white" },
  { symbol: "♥", name: "ハート", color: "text-red-400" },
  { symbol: "♦", name: "ダイヤ", color: "text-red-400" },
  { symbol: "♣", name: "クラブ", color: "text-white" },
];

type Card = {
  rank: string;
  suit: string;
};

const emptyCard: Card = {
  rank: "",
  suit: "",
};

export default function HeroHandPage() {
  const [firstCard, setFirstCard] = useState<Card>(emptyCard);
  const [secondCard, setSecondCard] = useState<Card>(emptyCard);
  const [activeCard, setActiveCard] = useState<1 | 2>(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("poker-read-hero-hand-draft");

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        firstCard?: Card;
        secondCard?: Card;
      };

      if (parsed.firstCard) {
        setFirstCard(parsed.firstCard);
      }

      if (parsed.secondCard) {
        setSecondCard(parsed.secondCard);
      }
    } catch {
      localStorage.removeItem("poker-read-hero-hand-draft");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "poker-read-hero-hand-draft",
      JSON.stringify({
        firstCard,
        secondCard,
      }),
    );
  }, [firstCard, secondCard]);

  const selectedCard = activeCard === 1 ? firstCard : secondCard;

  const handLabel = useMemo(() => {
    if (
      !firstCard.rank ||
      !firstCard.suit ||
      !secondCard.rank ||
      !secondCard.suit
    ) {
      return "2枚選ぶと表示されます";
    }

    if (
      firstCard.rank === secondCard.rank &&
      firstCard.suit === secondCard.suit
    ) {
      return "同じカードは選べません";
    }

    const suited = firstCard.suit === secondCard.suit;
    const pair = firstCard.rank === secondCard.rank;

    if (pair) {
      return `${firstCard.rank}${secondCard.rank}`;
    }

    return `${firstCard.rank}${secondCard.rank}${suited ? "s" : "o"}`;
  }, [firstCard, secondCard]);

  const isComplete =
    Boolean(firstCard.rank) &&
    Boolean(firstCard.suit) &&
    Boolean(secondCard.rank) &&
    Boolean(secondCard.suit) &&
    !(
      firstCard.rank === secondCard.rank &&
      firstCard.suit === secondCard.suit
    );

  function updateRank(rank: string) {
    if (activeCard === 1) {
      setFirstCard((current) => ({
        ...current,
        rank,
      }));
    } else {
      setSecondCard((current) => ({
        ...current,
        rank,
      }));
    }

    setMessage("");
  }

  function updateSuit(suit: string) {
    if (activeCard === 1) {
      setFirstCard((current) => ({
        ...current,
        suit,
      }));

      setActiveCard(2);
    } else {
      setSecondCard((current) => ({
        ...current,
        suit,
      }));
    }

    setMessage("");
  }

  function clearCards() {
    setFirstCard(emptyCard);
    setSecondCard(emptyCard);
    setActiveCard(1);
    localStorage.removeItem("poker-read-hero-hand-draft");
    setMessage("カードをクリアしました。");
  }

  function saveHand() {
    if (!isComplete) {
      setMessage("自分のカードを2枚選んでください。");
      return;
    }

    localStorage.setItem(
      "poker-read-hero-hand",
      JSON.stringify({
        firstCard,
        secondCard,
        notation: handLabel,
      }),
    );

    setMessage("自分のハンドを保存しました。");
  }

  function cardText(card: Card) {
    if (!card.rank && !card.suit) {
      return "未選択";
    }

    return `${card.rank || "?"}${card.suit || ""}`;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link
            href="/new-table"
            className="mb-5 inline-block text-sm font-semibold text-slate-400"
          >
            ← 前の画面へ戻る
          </Link>

          <p className="mb-2 text-sm font-bold text-emerald-400">
            STEP 2 / 自分のカード
          </p>

          <h1 className="text-3xl font-bold">
            自分のハンドを選ぶ
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            ランクとスートをタップしてください。
            2枚目まで選ぶと、AKsやQQのように自動表示します。
          </p>
        </header>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-2/5 rounded-full bg-emerald-500" />
        </div>

        <section className="mb-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveCard(1)}
            className={`rounded-2xl border p-5 text-left transition ${
              activeCard === 1
                ? "border-emerald-500 bg-emerald-950/50"
                : "border-slate-700 bg-slate-900"
            }`}
          >
            <p className="text-sm text-slate-400">1枚目</p>

            <p className="mt-2 text-4xl font-bold">
              {cardText(firstCard)}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveCard(2)}
            className={`rounded-2xl border p-5 text-left transition ${
              activeCard === 2
                ? "border-emerald-500 bg-emerald-950/50"
                : "border-slate-700 bg-slate-900"
            }`}
          >
            <p className="text-sm text-slate-400">2枚目</p>

            <p className="mt-2 text-4xl font-bold">
              {cardText(secondCard)}
            </p>
          </button>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-5">
            <p className="mb-1 text-sm font-bold text-emerald-400">
              {activeCard === 1 ? "1枚目を選択中" : "2枚目を選択中"}
            </p>

            <p className="text-sm text-slate-400">
              先にランク、次にスートを選んでください。
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold">
              ランク
            </h2>

            <div className="grid grid-cols-5 gap-2">
              {ranks.map((rank) => (
                <button
                  key={rank}
                  type="button"
                  onClick={() => updateRank(rank)}
                  className={`rounded-xl border py-3 text-lg font-bold transition active:scale-95 ${
                    selectedCard.rank === rank
                      ? "border-emerald-500 bg-emerald-500 text-slate-950"
                      : "border-slate-700 bg-slate-950"
                  }`}
                >
                  {rank}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-lg font-bold">
              スート
            </h2>

            <div className="grid grid-cols-4 gap-2">
              {suits.map((suit) => (
                <button
                  key={suit.symbol}
                  type="button"
                  onClick={() => updateSuit(suit.symbol)}
                  className={`rounded-xl border py-4 transition active:scale-95 ${
                    selectedCard.suit === suit.symbol
                      ? "border-emerald-500 bg-emerald-500 text-slate-950"
                      : "border-slate-700 bg-slate-950"
                  }`}
                >
                  <span className={`block text-3xl ${suit.color}`}>
                    {suit.symbol}
                  </span>

                  <span className="mt-1 block text-xs">
                    {suit.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-emerald-900 bg-emerald-950/40 p-5">
          <p className="text-sm text-emerald-300">
            選択したハンド
          </p>

          <p className="mt-2 text-4xl font-bold">
            {cardText(firstCard)} {cardText(secondCard)}
          </p>

          <p className="mt-3 text-lg font-bold text-emerald-400">
            {handLabel}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            sは同じスート、oは違うスートを表します。
            同じランクならQQのように表示します。
          </p>
        </section>

        {message && (
          <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <Link
            href={isComplete ? "/positions" : "#"}
            onClick={(event) => {
              if (!isComplete) {
                event.preventDefault();
                setMessage("自分のカードを2枚選んでください。");
                return;
              }

              saveHand();
            }}
            className={`block w-full rounded-2xl p-5 text-center text-lg font-bold transition ${
              isComplete
                ? "bg-emerald-500 text-slate-950 active:scale-95"
                : "cursor-not-allowed bg-slate-800 text-slate-500"
            }`}
          >
            保存して次へ
          </Link>

          <button
            type="button"
            onClick={clearCards}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 font-bold text-slate-300"
          >
            選択をクリア
          </button>
        </div>
      </div>
    </main>
  );
}