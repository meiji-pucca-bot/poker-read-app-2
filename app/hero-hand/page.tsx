"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const ranks = [
  "A",
  "K",
  "Q",
  "J",
  "T",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
] as const;

const suits = [
  {
    symbol: "♠",
    name: "スペード",
    color: "text-white",
  },
  {
    symbol: "♥",
    name: "ハート",
    color: "text-red-400",
  },
  {
    symbol: "♦",
    name: "ダイヤ",
    color: "text-red-400",
  },
  {
    symbol: "♣",
    name: "クラブ",
    color: "text-white",
  },
] as const;

type Card = {
  rank: string;
  suit: string;
};

type SavedHeroHand = {
  firstCard: Card;
  secondCard: Card;
  notation: string;
};

const draftStorageKey = "poker-read-hero-hand-draft";
const savedStorageKey = "poker-read-hero-hand";

function createEmptyCard(): Card {
  return {
    rank: "",
    suit: "",
  };
}

function cardText(card: Card) {
  if (!card.rank || !card.suit) {
    return "未選択";
  }

  return `${card.rank}${card.suit}`;
}

function isSameCard(first: Card, second: Card) {
  return (
    Boolean(first.rank) &&
    Boolean(first.suit) &&
    Boolean(second.rank) &&
    Boolean(second.suit) &&
    first.rank === second.rank &&
    first.suit === second.suit
  );
}

function createHandNotation(
  firstCard: Card,
  secondCard: Card,
) {
  if (
    !firstCard.rank ||
    !firstCard.suit ||
    !secondCard.rank ||
    !secondCard.suit
  ) {
    return "2枚選ぶと表示されます";
  }

  if (isSameCard(firstCard, secondCard)) {
    return "同じカードは選べません";
  }

  if (firstCard.rank === secondCard.rank) {
    return `${firstCard.rank}${secondCard.rank}`;
  }

  const firstRankIndex = ranks.indexOf(
    firstCard.rank as (typeof ranks)[number],
  );

  const secondRankIndex = ranks.indexOf(
    secondCard.rank as (typeof ranks)[number],
  );

  const highCard =
    firstRankIndex <= secondRankIndex
      ? firstCard
      : secondCard;

  const lowCard =
    firstRankIndex <= secondRankIndex
      ? secondCard
      : firstCard;

  const suffix =
    firstCard.suit === secondCard.suit ? "s" : "o";

  return `${highCard.rank}${lowCard.rank}${suffix}`;
}

export default function HeroHandPage() {
  const router = useRouter();

  const [firstCard, setFirstCard] =
    useState<Card>(createEmptyCard());

  const [secondCard, setSecondCard] =
    useState<Card>(createEmptyCard());

  const [activeCard, setActiveCard] =
    useState<1 | 2>(1);

  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem(
      draftStorageKey,
    );

    if (savedDraft) {
      try {
        const parsed = JSON.parse(
          savedDraft,
        ) as Partial<SavedHeroHand>;

        if (parsed.firstCard) {
          setFirstCard({
            rank: parsed.firstCard.rank ?? "",
            suit: parsed.firstCard.suit ?? "",
          });
        }

        if (parsed.secondCard) {
          setSecondCard({
            rank: parsed.secondCard.rank ?? "",
            suit: parsed.secondCard.suit ?? "",
          });
        }
      } catch {
        localStorage.removeItem(draftStorageKey);
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        firstCard,
        secondCard,
      }),
    );
  }, [firstCard, secondCard, loaded]);

  const selectedCard =
    activeCard === 1 ? firstCard : secondCard;

  const handLabel = useMemo(
    () => createHandNotation(firstCard, secondCard),
    [firstCard, secondCard],
  );

  const isComplete =
    Boolean(firstCard.rank) &&
    Boolean(firstCard.suit) &&
    Boolean(secondCard.rank) &&
    Boolean(secondCard.suit) &&
    !isSameCard(firstCard, secondCard);

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
    const nextCard: Card = {
      ...selectedCard,
      suit,
    };

    const otherCard =
      activeCard === 1
        ? secondCard
        : firstCard;

    if (isSameCard(nextCard, otherCard)) {
      setMessage("同じカードは2回選べません。");
      return;
    }

    if (activeCard === 1) {
      setFirstCard(nextCard);
      setActiveCard(2);
    } else {
      setSecondCard(nextCard);
    }

    setMessage("");
  }

  function clearCards() {
    setFirstCard(createEmptyCard());
    setSecondCard(createEmptyCard());
    setActiveCard(1);
    setMessage("カード選択をクリアしました。");

    localStorage.removeItem(draftStorageKey);
    localStorage.removeItem(savedStorageKey);
  }

  function saveHand() {
    if (!isComplete) {
      setMessage(
        "自分のカードを2枚選択してください。",
      );
      return;
    }

    const savedHand: SavedHeroHand = {
      firstCard,
      secondCard,
      notation: handLabel,
    };

    localStorage.setItem(
      savedStorageKey,
      JSON.stringify(savedHand),
    );

    localStorage.removeItem(draftStorageKey);

    router.push("/positions");
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
            STEP 2 / 自分のハンド
          </p>

          <h1 className="text-3xl font-bold">
            自分のハンドを選ぶ
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            カードを2枚選択してください。
            選択したハンドはAKs・ATo・QQのように自動表示されます。
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
            <p className="text-sm text-slate-400">
              1枚目
            </p>

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
            <p className="text-sm text-slate-400">
              2枚目
            </p>

            <p className="mt-2 text-4xl font-bold">
              {cardText(secondCard)}
            </p>
          </button>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-5">
            <p className="text-sm font-bold text-emerald-400">
              {activeCard === 1
                ? "1枚目を選択中"
                : "2枚目を選択中"}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              カードを2枚選択してください。
            </p>
          </div>

          <h2 className="text-lg font-bold">
            ランク
          </h2>

          <div className="mt-3 grid grid-cols-5 gap-2">
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

          <h2 className="mt-6 text-lg font-bold">
            スート
          </h2>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {suits.map((suit) => (
              <button
                key={suit.symbol}
                type="button"
                onClick={() =>
                  updateSuit(suit.symbol)
                }
                className={`rounded-xl border py-4 transition active:scale-95 ${
                  selectedCard.suit === suit.symbol
                    ? "border-emerald-500 bg-emerald-500 text-slate-950"
                    : "border-slate-700 bg-slate-950"
                }`}
              >
                <span
                  className={`block text-3xl ${suit.color}`}
                >
                  {suit.symbol}
                </span>

                <span className="mt-1 block text-xs">
                  {suit.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-emerald-900 bg-emerald-950/40 p-5">
          <p className="text-sm text-emerald-300">
            選択したハンド
          </p>

          <p className="mt-2 text-4xl font-bold">
            {cardText(firstCard)}{" "}
            {cardText(secondCard)}
          </p>

          <p className="mt-3 text-2xl font-bold text-emerald-400">
            {handLabel}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            sは同じスート、oは違うスートを表します。
            同じランクならQQのように表示します。
          </p>
        </section>

        {message && (
          <p className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={saveHand}
            className={`w-full rounded-2xl p-5 text-lg font-bold transition ${
              isComplete
                ? "bg-emerald-500 text-slate-950 active:scale-95"
                : "bg-slate-800 text-slate-500"
            }`}
          >
            保存して次へ
          </button>

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