"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
    text: "text-white",
  },
  {
    symbol: "♥",
    name: "ハート",
    text: "text-red-400",
  },
  {
    symbol: "♦",
    name: "ダイヤ",
    text: "text-red-400",
  },
  {
    symbol: "♣",
    name: "クラブ",
    text: "text-white",
  },
] as const;

const EMPTY_PREVIOUS_BOARD_KEYS: string[] = [];

type Card = {
  rank: string;
  suit: string;
};

type Actor = "hero" | "villain";

type ActionType =
  | "Check"
  | "Bet"
  | "Call"
  | "Raise"
  | "Fold"
  | "All-in";

type StreetAction = {
  id: string;
  actor: Actor;
  action: ActionType;

  /**
   * Bet / Raise / All-inで入力した最終額。
   * Callの場合は自動計算された最終投入額。
   */
  amount: string;

  /**
   * このアクションで実際に追加された金額。
   */
  addedAmount: number;

  /**
   * アクション直前のポット。
   */
  potBefore: number;

  /**
   * アクション直前のポットに対する追加額の割合。
   */
  potPercent: number | null;
};

type Positions = {
  heroPosition?: string;
  villainPosition?: string;
};

type CurrentTable = {
  bigBlind?: string;
};

type SavedPreflop = {
  endingPot?: number;
};

type StoredStreet = {
  startingPot?: number;
  endingPot?: number;
  board: Card[];
  actions: StreetAction[];
  savedAt?: string;
};

type StreetDraft = {
  board: Card[];
  actions: StreetAction[];
};

type HeroHandStorage = {
  firstCard?: Card;
  secondCard?: Card;
};

type StreetEntryProps = {
  streetName: "flop" | "turn" | "river";
  japaneseTitle: string;
  stepText: string;
  cardCount: number;
  previousHref: string;
  nextHref: string;
  previousBoardKeys?: string[];
};

const actionOptions: {
  key: ActionType;
  label: string;
  description: string;
  needsAmount: boolean;
}[] = [
  {
    key: "Check",
    label: "チェック",
    description: "賭けずに相手へ回す",
    needsAmount: false,
  },
  {
    key: "Bet",
    label: "ベット",
    description: "最初に賭ける",
    needsAmount: true,
  },
  {
    key: "Call",
    label: "コール",
    description: "相手の現在額に合わせる",
    needsAmount: false,
  },
  {
    key: "Raise",
    label: "レイズ",
    description: "現在の投入額をさらに上げる",
    needsAmount: true,
  },
  {
    key: "Fold",
    label: "フォールド",
    description: "降りる",
    needsAmount: false,
  },
  {
    key: "All-in",
    label: "オールイン",
    description: "最終的な投入額を入力",
    needsAmount: true,
  },
];

function createEmptyCards(count: number): Card[] {
  return Array.from({ length: count }, () => ({
    rank: "",
    suit: "",
  }));
}

function formatNumber(value: string | number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString("ja-JP");
}

function convertToBb(
  amount: string | number,
  bigBlind: string,
) {
  const amountNumber = Number(amount);
  const bigBlindNumber = Number(bigBlind);

  if (
    !bigBlind ||
    !Number.isFinite(amountNumber) ||
    !Number.isFinite(bigBlindNumber) ||
    bigBlindNumber <= 0
  ) {
    return null;
  }

  return amountNumber / bigBlindNumber;
}

function convertToPotPercent(
  amount: string | number,
  pot: string | number,
) {
  const amountNumber = Number(amount);
  const potNumber = Number(pot);

  if (
    !Number.isFinite(amountNumber) ||
    !Number.isFinite(potNumber) ||
    potNumber <= 0
  ) {
    return null;
  }

  return (amountNumber / potNumber) * 100;
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
    first.rank === second.rank &&
    first.suit === second.suit
  );
}

function getStartingPotStorageKey(
  streetName: StreetEntryProps["streetName"],
) {
  if (streetName === "flop") {
    return "poker-read-preflop";
  }

  if (streetName === "turn") {
    return "poker-read-flop";
  }

  return "poker-read-turn";
}

export default function StreetEntry({
  streetName,
  japaneseTitle,
  stepText,
  cardCount,
  previousHref,
  nextHref,
  previousBoardKeys = EMPTY_PREVIOUS_BOARD_KEYS,
}: StreetEntryProps) {
  const router = useRouter();

  const [positions, setPositions] =
    useState<Positions>({});

  const [bigBlind, setBigBlind] = useState("");

  const [startingPot, setStartingPot] =
    useState(0);

  const [previousBoard, setPreviousBoard] =
    useState<Card[]>([]);

  const [heroCards, setHeroCards] =
    useState<Card[]>([]);

  const [board, setBoard] = useState<Card[]>(
    createEmptyCards(cardCount),
  );

  const [activeCardIndex, setActiveCardIndex] =
    useState(0);

  const [actor, setActor] =
    useState<Actor>("hero");

  const [selectedAction, setSelectedAction] =
    useState<ActionType | "">("");

  const [amount, setAmount] = useState("");

  const [actions, setActions] = useState<
    StreetAction[]
  >([]);

  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  const storageKey = `poker-read-${streetName}`;
  const draftKey = `poker-read-${streetName}-draft`;

  useEffect(() => {
    const savedPositions = localStorage.getItem(
      "poker-read-positions",
    );

    if (savedPositions) {
      try {
        setPositions(
          JSON.parse(savedPositions) as Positions,
        );
      } catch {
        setMessage(
          "ポジション情報を読み込めませんでした。",
        );
      }
    }

    const savedTable = localStorage.getItem(
      "poker-read-current-table",
    );

    if (savedTable) {
      try {
        const parsed = JSON.parse(
          savedTable,
        ) as CurrentTable;

        setBigBlind(parsed.bigBlind ?? "");
      } catch {
        setMessage(
          "テーブル情報を読み込めませんでした。",
        );
      }
    }

    const heroHand = localStorage.getItem(
      "poker-read-hero-hand",
    );

    if (heroHand) {
      try {
        const parsed = JSON.parse(
          heroHand,
        ) as HeroHandStorage;

        const cards: Card[] = [];

        if (parsed.firstCard) {
          cards.push(parsed.firstCard);
        }

        if (parsed.secondCard) {
          cards.push(parsed.secondCard);
        }

        setHeroCards(cards);
      } catch {
        // Hero Handがなくても入力は続けられます。
      }
    }

    const startingPotKey =
      getStartingPotStorageKey(streetName);

    const savedPreviousStreet =
      localStorage.getItem(startingPotKey);

    if (savedPreviousStreet) {
      try {
        if (streetName === "flop") {
          const parsed = JSON.parse(
            savedPreviousStreet,
          ) as SavedPreflop;

          setStartingPot(parsed.endingPot ?? 0);
        } else {
          const parsed = JSON.parse(
            savedPreviousStreet,
          ) as StoredStreet;

          setStartingPot(parsed.endingPot ?? 0);
        }
      } catch {
        setMessage(
          "前のストリートのポットを読み込めませんでした。",
        );
      }
    }

    const loadedPreviousBoard: Card[] = [];

    previousBoardKeys.forEach((key) => {
      const savedStreet =
        localStorage.getItem(key);

      if (!savedStreet) {
        return;
      }

      try {
        const parsed = JSON.parse(
          savedStreet,
        ) as StoredStreet;

        if (Array.isArray(parsed.board)) {
          loadedPreviousBoard.push(
            ...parsed.board,
          );
        }
      } catch {
        // 前ストリートがなくても入力可能にします。
      }
    });

    setPreviousBoard(loadedPreviousBoard);

    const savedDraft =
      localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const parsed = JSON.parse(
          savedDraft,
        ) as StreetDraft;

        setBoard(
          Array.isArray(parsed.board) &&
            parsed.board.length === cardCount
            ? parsed.board
            : createEmptyCards(cardCount),
        );

        setActions(
          Array.isArray(parsed.actions)
            ? parsed.actions
            : [],
        );
      } catch {
        localStorage.removeItem(draftKey);
      }
    }

    setLoaded(true);
  }, [
    cardCount,
    draftKey,
    previousBoardKeys,
    streetName,
  ]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    localStorage.setItem(
      draftKey,
      JSON.stringify({
        board,
        actions,
      }),
    );
  }, [actions, board, draftKey, loaded]);

  const currentPot = useMemo(() => {
    const addedTotal = actions.reduce(
      (total, item) =>
        total + Number(item.addedAmount || 0),
      0,
    );

    return startingPot + addedTotal;
  }, [actions, startingPot]);

  const actorContributions = useMemo(() => {
    return actions.reduce(
      (result, item) => {
        result[item.actor] +=
          Number(item.addedAmount || 0);

        return result;
      },
      {
        hero: 0,
        villain: 0,
      } as Record<Actor, number>,
    );
  }, [actions]);

  const currentHighestContribution =
    Math.max(
      actorContributions.hero,
      actorContributions.villain,
    );

  const selectedActionInfo =
    actionOptions.find(
      (option) =>
        option.key === selectedAction,
    );

  const activeCard = board[activeCardIndex];

  const inputAmountBb = useMemo(
    () => convertToBb(amount, bigBlind),
    [amount, bigBlind],
  );

  const actorCurrentContribution =
    actorContributions[actor];

  const previewAddedAmount = useMemo(() => {
    if (
      !selectedAction ||
      selectedAction === "Check" ||
      selectedAction === "Fold"
    ) {
      return 0;
    }

    if (selectedAction === "Call") {
      return Math.max(
        0,
        currentHighestContribution -
          actorCurrentContribution,
      );
    }

    const finalAmount = Number(amount) || 0;

    return Math.max(
      0,
      finalAmount -
        actorCurrentContribution,
    );
  }, [
    actorCurrentContribution,
    amount,
    currentHighestContribution,
    selectedAction,
  ]);

  const previewPotPercent = useMemo(
    () =>
      convertToPotPercent(
        previewAddedAmount,
        currentPot,
      ),
    [currentPot, previewAddedAmount],
  );

  const boardComplete = board.every(
    (card) =>
      Boolean(card.rank) &&
      Boolean(card.suit),
  );

  function actorLabel(target: Actor) {
    if (target === "hero") {
      return `自分${
        positions.heroPosition
          ? `（${positions.heroPosition}）`
          : ""
      }`;
    }

    return `相手${
      positions.villainPosition
        ? `（${positions.villainPosition}）`
        : ""
    }`;
  }

  function updateCardRank(rank: string) {
    setBoard((current) =>
      current.map((card, index) =>
        index === activeCardIndex
          ? {
              ...card,
              rank,
            }
          : card,
      ),
    );

    setMessage("");
  }

  function updateCardSuit(suit: string) {
    const nextCard = {
      ...activeCard,
      suit,
    };

    const duplicateInCurrentBoard =
      board.some(
        (card, index) =>
          index !== activeCardIndex &&
          isSameCard(card, nextCard),
      );

    const duplicateInPreviousBoard =
      previousBoard.some((card) =>
        isSameCard(card, nextCard),
      );

    const duplicateInHeroHand =
      heroCards.some((card) =>
        isSameCard(card, nextCard),
      );

    if (
      duplicateInCurrentBoard ||
      duplicateInPreviousBoard ||
      duplicateInHeroHand
    ) {
      setMessage(
        "同じカードは2回選べません。",
      );
      return;
    }

    setBoard((current) =>
      current.map((card, index) =>
        index === activeCardIndex
          ? nextCard
          : card,
      ),
    );

    if (
      activeCardIndex <
      cardCount - 1
    ) {
      setActiveCardIndex(
        activeCardIndex + 1,
      );
    }

    setMessage("");
  }

  function addAction() {
    if (!selectedAction) {
      setMessage(
        "アクションを選んでください。",
      );
      return;
    }

    if (
      selectedActionInfo?.needsAmount &&
      !amount
    ) {
      setMessage(
        "最終的な投入額を入力してください。",
      );
      return;
    }

    if (
      selectedAction === "Bet" ||
      selectedAction === "Raise" ||
      selectedAction === "All-in"
    ) {
      const finalAmount = Number(amount);

      if (
        !Number.isFinite(finalAmount) ||
        finalAmount <=
          actorCurrentContribution
      ) {
        setMessage(
          "現在の投入額より大きい最終額を入力してください。",
        );
        return;
      }

      if (
        selectedAction === "Raise" &&
        finalAmount <=
          currentHighestContribution
      ) {
        setMessage(
          "レイズ額は相手の現在額より大きくしてください。",
        );
        return;
      }
    }

    if (
      selectedAction === "Call" &&
      previewAddedAmount <= 0
    ) {
      setMessage(
        "現在はコールする金額がありません。",
      );
      return;
    }

    const finalAmount =
      selectedAction === "Call"
        ? currentHighestContribution
        : selectedActionInfo?.needsAmount
          ? Number(amount)
          : actorCurrentContribution;

    const addedAmount =
      selectedAction === "Call"
        ? previewAddedAmount
        : selectedActionInfo?.needsAmount
          ? Math.max(
              0,
              finalAmount -
                actorCurrentContribution,
            )
          : 0;

    const newAction: StreetAction = {
      id: crypto.randomUUID(),
      actor,
      action: selectedAction,
      amount:
        selectedAction === "Check" ||
        selectedAction === "Fold"
          ? ""
          : String(finalAmount),
      addedAmount,
      potBefore: currentPot,
      potPercent:
        convertToPotPercent(
          addedAmount,
          currentPot,
        ),
    };

    setActions((current) => [
      ...current,
      newAction,
    ]);

    setSelectedAction("");
    setAmount("");
    setActor(
      actor === "hero"
        ? "villain"
        : "hero",
    );
    setMessage("");
  }

  function undoLastAction() {
    const lastAction = actions.at(-1);

    if (lastAction) {
      setActor(lastAction.actor);
    }

    setActions((current) =>
      current.slice(0, -1),
    );

    setSelectedAction("");
    setAmount("");
    setMessage("");
  }

  function clearStreet() {
    setBoard(
      createEmptyCards(cardCount),
    );

    setActiveCardIndex(0);
    setActor("hero");
    setSelectedAction("");
    setAmount("");
    setActions([]);

    localStorage.removeItem(draftKey);

    setMessage(
      `${japaneseTitle}の入力をクリアしました。`,
    );
  }

  function saveAndNext() {
    if (startingPot <= 0) {
      setMessage(
        "前のストリートのポットを確認してください。",
      );
      return;
    }

    if (!boardComplete) {
      setMessage(
        `${japaneseTitle}のカードをすべて選んでください。`,
      );
      return;
    }

    if (actions.length === 0) {
      setMessage(
        `${japaneseTitle}のアクションを1つ以上入力してください。`,
      );
      return;
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        startingPot,
        endingPot: currentPot,
        board,
        actions,
        savedAt:
          new Date().toISOString(),
      }),
    );

    localStorage.removeItem(draftKey);

    router.push(nextHref);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link
            href={previousHref}
            className="mb-5 inline-block text-sm font-semibold text-slate-400"
          >
            ← 前の画面へ戻る
          </Link>

          <p className="mb-2 text-sm font-bold text-emerald-400">
            {stepText}
          </p>

          <h1 className="text-3xl font-bold">
            {japaneseTitle}を記録
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            ボードと、自分・相手の行動を順番に入力します。
          </p>
        </header>

        {previousBoard.length > 0 && (
          <section className="mb-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">
              ここまでのボード
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {previousBoard.map(
                (card, index) => (
                  <div
                    key={`${card.rank}-${card.suit}-${index}`}
                    className="rounded-xl bg-slate-950 px-4 py-3 text-2xl font-bold"
                  >
                    {cardText(card)}
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        <section className="mb-4 rounded-2xl border border-emerald-900 bg-emerald-950/40 p-5">
          <p className="text-sm text-emerald-300">
            現在のポット
          </p>

          <p className="mt-1 text-3xl font-bold">
            {formatNumber(currentPot)}
          </p>

          <p className="mt-2 text-sm text-slate-300">
            {convertToBb(
              currentPot,
              bigBlind,
            ) !== null
              ? `${Number(
                  convertToBb(
                    currentPot,
                    bigBlind,
                  )!.toFixed(2),
                )}bb`
              : "BBを入力するとBB換算されます"}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            前のストリートと入力済みアクションから自動計算しています。
          </p>
        </section>

        <section className="mb-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-bold">
            {japaneseTitle}のカード
          </h2>

          <div
            className={`mt-4 grid gap-3 ${
              cardCount === 3
                ? "grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {board.map(
              (card, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    setActiveCardIndex(index)
                  }
                  className={`rounded-2xl border p-4 text-center ${
                    activeCardIndex === index
                      ? "border-emerald-500 bg-emerald-950/40"
                      : "border-slate-700 bg-slate-950"
                  }`}
                >
                  <span className="block text-xs text-slate-400">
                    {index + 1}枚目
                  </span>

                  <span className="mt-2 block text-3xl font-bold">
                    {cardText(card)}
                  </span>
                </button>
              ),
            )}
          </div>

          <h3 className="mt-6 font-bold">
            ランク
          </h3>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {ranks.map((rank) => (
              <button
                key={rank}
                type="button"
                onClick={() =>
                  updateCardRank(rank)
                }
                className={`rounded-xl border py-3 font-bold ${
                  activeCard?.rank === rank
                    ? "border-emerald-500 bg-emerald-500 text-slate-950"
                    : "border-slate-700 bg-slate-950"
                }`}
              >
                {rank}
              </button>
            ))}
          </div>

          <h3 className="mt-6 font-bold">
            スート
          </h3>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {suits.map((suit) => (
              <button
                key={suit.symbol}
                type="button"
                onClick={() =>
                  updateCardSuit(
                    suit.symbol,
                  )
                }
                className={`rounded-xl border py-3 ${
                  activeCard?.suit ===
                  suit.symbol
                    ? "border-emerald-500 bg-emerald-500 text-slate-950"
                    : "border-slate-700 bg-slate-950"
                }`}
              >
                <span
                  className={`block text-3xl ${suit.text}`}
                >
                  {suit.symbol}
                </span>

                <span className="block text-xs">
                  {suit.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-bold">
            アクションを追加
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setActor("hero")
              }
              className={`rounded-xl border p-4 text-left ${
                actor === "hero"
                  ? "border-emerald-500 bg-emerald-500 text-slate-950"
                  : "border-slate-700 bg-slate-950"
              }`}
            >
              <span className="block text-xs">
                行動した人
              </span>

              <span className="mt-1 block font-bold">
                {actorLabel("hero")}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActor("villain")
              }
              className={`rounded-xl border p-4 text-left ${
                actor === "villain"
                  ? "border-sky-400 bg-sky-500 text-slate-950"
                  : "border-slate-700 bg-slate-950"
              }`}
            >
              <span className="block text-xs">
                行動した人
              </span>

              <span className="mt-1 block font-bold">
                {actorLabel(
                  "villain",
                )}
              </span>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {actionOptions.map(
              (option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setSelectedAction(
                      option.key,
                    );

                    if (
                      !option.needsAmount
                    ) {
                      setAmount("");
                    }

                    setMessage("");
                  }}
                  className={`rounded-xl border p-3 text-left ${
                    selectedAction ===
                    option.key
                      ? "border-emerald-500 bg-emerald-500 text-slate-950"
                      : "border-slate-700 bg-slate-950"
                  }`}
                >
                  <span className="block font-bold">
                    {option.label}
                  </span>

                  <span className="mt-1 block text-xs">
                    {
                      option.description
                    }
                  </span>
                </button>
              ),
            )}
          </div>

          {selectedAction === "Call" && (
            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">
                自動計算されるコール額
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-400">
                {formatNumber(
                  previewAddedAmount,
                )}

                {convertToBb(
                  previewAddedAmount,
                  bigBlind,
                ) !== null &&
                  `（${Number(
                    convertToBb(
                      previewAddedAmount,
                      bigBlind,
                    )!.toFixed(2),
                  )}bb）`}
              </p>
            </div>
          )}

          {selectedActionInfo?.needsAmount && (
            <div className="mt-5">
              <label
                htmlFor={`${streetName}-amount`}
                className="block font-bold"
              >
                最終的な投入額
              </label>

              <p className="mt-1 text-sm text-slate-400">
                レイズの場合も、最終的にいくらまで上げたかを入力します。
              </p>

              <input
                id={`${streetName}-amount`}
                inputMode="numeric"
                value={amount}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  if (
                    value === "" ||
                    /^\d*$/.test(value)
                  ) {
                    setAmount(value);
                  }
                }}
                placeholder="例：500"
                className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-2xl font-bold outline-none focus:border-emerald-500"
              />

              {amount && (
                <div className="mt-3 rounded-xl border border-emerald-900 bg-emerald-950/40 p-4">
                  <p className="font-bold text-emerald-300">
                    {formatNumber(amount)}

                    {inputAmountBb !== null &&
                      `（${Number(
                        inputAmountBb.toFixed(
                          2,
                        ),
                      )}bb）`}
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    今回の追加額：
                    {formatNumber(
                      previewAddedAmount,
                    )}

                    {previewPotPercent !==
                      null &&
                      ` / ${Math.round(
                        previewPotPercent,
                      )}% Pot`}
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={addAction}
            className="mt-5 w-full rounded-xl bg-emerald-500 p-4 font-bold text-slate-950 active:scale-95"
          >
            このアクションを追加
          </button>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              入力した流れ
            </h2>

            <button
              type="button"
              onClick={undoLastAction}
              disabled={
                actions.length === 0
              }
              className="text-sm font-bold text-amber-300 disabled:text-slate-600"
            >
              1つ戻る
            </button>
          </div>

          {actions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              まだアクションがありません。
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {actions.map(
                (item, index) => {
                  const addedBb =
                    convertToBb(
                      item.addedAmount,
                      bigBlind,
                    );

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-3 ${
                        item.actor ===
                        "hero"
                          ? "border-emerald-900 bg-emerald-950/30"
                          : "border-sky-900 bg-sky-950/30"
                      }`}
                    >
                      <p className="font-bold">
                        {index + 1}.{" "}
                        {actorLabel(
                          item.actor,
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-300">
                        {
                          actionOptions.find(
                            (option) =>
                              option.key ===
                              item.action,
                          )?.label
                        }

                        {item.amount &&
                          ` ${formatNumber(
                            item.amount,
                          )}`}

                        {addedBb !== null &&
                          item.addedAmount >
                            0 &&
                          `（追加 ${Number(
                            addedBb.toFixed(
                              2,
                            ),
                          )}bb`}

                        {item.potPercent !==
                          null &&
                          item.addedAmount >
                            0 &&
                          ` / ${Math.round(
                            item.potPercent,
                          )}% Pot`}

                        {addedBb !== null &&
                          item.addedAmount >
                            0 &&
                          "）"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        アクション後ポット：
                        {formatNumber(
                          item.potBefore +
                            item.addedAmount,
                        )}
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        {message && (
          <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={saveAndNext}
            className="w-full rounded-2xl bg-emerald-500 p-5 text-lg font-bold text-slate-950 active:scale-95"
          >
            保存して次へ
          </button>

          <button
            type="button"
            onClick={clearStreet}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 font-bold text-slate-300"
          >
            {japaneseTitle}をクリア
          </button>
        </div>
      </div>
    </main>
  );
}