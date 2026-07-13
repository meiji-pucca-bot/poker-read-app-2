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
  { symbol: "♠", name: "スペード", color: "text-white" },
  { symbol: "♥", name: "ハート", color: "text-red-400" },
  { symbol: "♦", name: "ダイヤ", color: "text-red-400" },
  { symbol: "♣", name: "クラブ", color: "text-white" },
] as const;

const EMPTY_PREVIOUS_BOARD_KEYS: string[] = [];

type StreetName = "flop" | "turn" | "river";

type Card = {
  rank: string;
  suit: string;
};

type Villain = {
  id: string;
  position: string;
  stack: string;
};

type Player = {
  id: string;
  role: "hero" | "villain";
  position: string;
  stack: string;
  label: string;
};

type ActionType =
  | "Check"
  | "Bet"
  | "Call"
  | "Raise"
  | "Fold"
  | "All-in";

type StreetAction = {
  id: string;
  playerId: string;
  role: "hero" | "villain";
  position: string;
  action: ActionType;
  amount: string;
  addedAmount: number;
  potBefore: number;
  potPercent: number | null;
};

type StoredPositions = {
  heroPosition?: string;
  villains?: Villain[];
};

type StoredTable = {
  heroStack?: string;
  bigBlind?: string;
};

type StoredHeroHand = {
  firstCard?: Card;
  secondCard?: Card;
};

type StoredPreflop = {
  endingPot?: number;
  contributions?: Record<string, number>;
  villains?: Villain[];
};

type StoredStreet = {
  startingPot?: number;
  endingPot?: number;
  board?: Card[];
  actions?: StreetAction[];
  savedAt?: string;
};

type StreetDraft = {
  board?: Card[];
  actions?: StreetAction[];
  activePlayerId?: string;
};

type StreetEntryProps = {
  streetName: StreetName;
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
    description: "追加せず相手へ回す",
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
    description: "現在の最高額に合わせる",
    needsAmount: false,
  },
  {
    key: "Raise",
    label: "レイズ",
    description: "現在の最高額より上げる",
    needsAmount: true,
  },
  {
    key: "Fold",
    label: "フォールド",
    description: "ハンドを降りる",
    needsAmount: false,
  },
  {
    key: "All-in",
    label: "オールイン",
    description: "残りスタックをすべて自動投入",
    needsAmount: false,
  },
];

function createEmptyCards(count: number): Card[] {
  return Array.from({ length: count }, () => ({
    rank: "",
    suit: "",
  }));
}

function safeParse<T>(key: string): T | null {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved) as T;
  } catch {
    return null;
  }
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

function cardText(card?: Card) {
  if (!card?.rank || !card?.suit) {
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

function startingPotStorageKey(
  streetName: StreetName,
) {
  if (streetName === "flop") {
    return "poker-read-preflop";
  }

  if (streetName === "turn") {
    return "poker-read-flop";
  }

  return "poker-read-turn";
}

function calculateSpentBeforeStreet(
  player: Player,
  streetName: StreetName,
  preflop: StoredPreflop | null,
  flop: StoredStreet | null,
  turn: StoredStreet | null,
) {
  let spent = 0;

  spent +=
    Number(
      preflop?.contributions?.[player.position],
    ) || 0;

  if (streetName === "turn" || streetName === "river") {
    spent +=
      flop?.actions
        ?.filter(
          (action) =>
            action.playerId === player.id ||
            action.position === player.position,
        )
        .reduce(
          (total, action) =>
            total +
            Number(action.addedAmount || 0),
          0,
        ) || 0;
  }

  if (streetName === "river") {
    spent +=
      turn?.actions
        ?.filter(
          (action) =>
            action.playerId === player.id ||
            action.position === player.position,
        )
        .reduce(
          (total, action) =>
            total +
            Number(action.addedAmount || 0),
          0,
        ) || 0;
  }

  return spent;
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

  const [players, setPlayers] = useState<Player[]>([]);
  const [spentBeforeStreet, setSpentBeforeStreet] =
    useState<Record<string, number>>({});

  const [bigBlind, setBigBlind] = useState("");
  const [startingPot, setStartingPot] = useState(0);

  const [heroCards, setHeroCards] = useState<Card[]>([]);
  const [previousBoard, setPreviousBoard] =
    useState<Card[]>([]);

  const [board, setBoard] = useState<Card[]>(
    createEmptyCards(cardCount),
  );

  const [activeCardIndex, setActiveCardIndex] =
    useState(0);

  const [activePlayerId, setActivePlayerId] =
    useState("");

  const [selectedAction, setSelectedAction] =
    useState<ActionType | "">("");

  const [amount, setAmount] = useState("");

  const [actions, setActions] =
    useState<StreetAction[]>([]);

  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  const storageKey = `poker-read-${streetName}`;
  const draftKey = `poker-read-${streetName}-draft`;

  useEffect(() => {
    const table = safeParse<StoredTable>(
      "poker-read-current-table",
    );

    const positions = safeParse<StoredPositions>(
      "poker-read-positions",
    );

    const preflop = safeParse<StoredPreflop>(
      "poker-read-preflop",
    );

    const flop = safeParse<StoredStreet>(
      "poker-read-flop",
    );

    const turn = safeParse<StoredStreet>(
      "poker-read-turn",
    );

    const heroHand = safeParse<StoredHeroHand>(
      "poker-read-hero-hand",
    );

    setBigBlind(table?.bigBlind ?? "");

    const heroPosition =
      positions?.heroPosition ?? "";

    const villains =
      Array.isArray(preflop?.villains)
        ? preflop.villains
        : Array.isArray(positions?.villains)
          ? positions.villains
          : [];

    const loadedPlayers: Player[] = [];

    if (heroPosition) {
      loadedPlayers.push({
        id: "hero",
        role: "hero",
        position: heroPosition,
        stack: table?.heroStack ?? "",
        label: `自分（${heroPosition}）`,
      });
    }

    villains.forEach((villain) => {
      loadedPlayers.push({
        id: `villain-${villain.position}`,
        role: "villain",
        position: villain.position,
        stack: villain.stack,
        label: `相手（${villain.position}）`,
      });
    });

    setPlayers(loadedPlayers);

    const spentMap: Record<string, number> = {};

    loadedPlayers.forEach((player) => {
      spentMap[player.id] =
        calculateSpentBeforeStreet(
          player,
          streetName,
          preflop,
          flop,
          turn,
        );
    });

    setSpentBeforeStreet(spentMap);

    if (loadedPlayers.length > 0) {
      setActivePlayerId(loadedPlayers[0].id);
    }

    const previousPotData = safeParse<
      StoredPreflop | StoredStreet
    >(startingPotStorageKey(streetName));

    setStartingPot(
      Number(previousPotData?.endingPot) || 0,
    );

    if (heroHand) {
      const cards: Card[] = [];

      if (heroHand.firstCard) {
        cards.push(heroHand.firstCard);
      }

      if (heroHand.secondCard) {
        cards.push(heroHand.secondCard);
      }

      setHeroCards(cards);
    }

    const loadedPreviousBoard: Card[] = [];

    previousBoardKeys.forEach((key) => {
      const street =
        safeParse<StoredStreet>(key);

      if (Array.isArray(street?.board)) {
        loadedPreviousBoard.push(
          ...street.board,
        );
      }
    });

    setPreviousBoard(loadedPreviousBoard);

    const draft =
      safeParse<StreetDraft>(draftKey);

    if (draft) {
      if (
        Array.isArray(draft.board) &&
        draft.board.length === cardCount
      ) {
        setBoard(draft.board);
      }

      if (Array.isArray(draft.actions)) {
        setActions(draft.actions);
      }

      if (draft.activePlayerId) {
        setActivePlayerId(
          draft.activePlayerId,
        );
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
        activePlayerId,
      }),
    );
  }, [
    actions,
    activePlayerId,
    board,
    draftKey,
    loaded,
  ]);

  const activePlayer = players.find(
    (player) =>
      player.id === activePlayerId,
  );

  const foldedPlayerIds = useMemo(
    () =>
      new Set(
        actions
          .filter(
            (action) =>
              action.action === "Fold",
          )
          .map(
            (action) =>
              action.playerId,
          ),
      ),
    [actions],
  );

  const currentPot = useMemo(() => {
    const addedTotal = actions.reduce(
      (total, action) =>
        total +
        Number(action.addedAmount || 0),
      0,
    );

    return startingPot + addedTotal;
  }, [actions, startingPot]);

  const contributions = useMemo(() => {
    const result: Record<string, number> = {};

    players.forEach((player) => {
      result[player.id] = 0;
    });

    actions.forEach((action) => {
      result[action.playerId] =
        (result[action.playerId] ?? 0) +
        Number(action.addedAmount || 0);
    });

    return result;
  }, [actions, players]);

  const highestContribution = Math.max(
    0,
    ...Object.values(contributions),
  );

  const activeContribution =
    activePlayerId
      ? contributions[activePlayerId] ?? 0
      : 0;

  const activeSpentBefore =
    activePlayerId
      ? spentBeforeStreet[activePlayerId] ?? 0
      : 0;

  const activeStartingStack =
    Number(activePlayer?.stack) || 0;

  const activeRemainingStack = Math.max(
    0,
    activeStartingStack -
      activeSpentBefore -
      activeContribution,
  );

  const automaticCallAmount = Math.max(
    0,
    highestContribution -
      activeContribution,
  );

  const selectedActionInfo =
    actionOptions.find(
      (option) =>
        option.key === selectedAction,
    );

  const previewAddedAmount = useMemo(() => {
    if (!selectedAction) {
      return 0;
    }

    if (
      selectedAction === "Check" ||
      selectedAction === "Fold"
    ) {
      return 0;
    }

    if (selectedAction === "Call") {
      return Math.min(
        automaticCallAmount,
        activeRemainingStack,
      );
    }

    if (selectedAction === "All-in") {
      return activeRemainingStack;
    }

    const finalAmount =
      Number(amount) || 0;

    return Math.max(
      0,
      finalAmount -
        activeContribution,
    );
  }, [
    activeContribution,
    activeRemainingStack,
    amount,
    automaticCallAmount,
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

  const activeCard =
    board[activeCardIndex];

  const boardComplete = board.every(
    (card) =>
      Boolean(card.rank) &&
      Boolean(card.suit),
  );

  function selectPlayer(playerId: string) {
    if (foldedPlayerIds.has(playerId)) {
      setMessage(
        "このプレイヤーはすでにフォールドしています。",
      );
      return;
    }

    setActivePlayerId(playerId);
    setSelectedAction("");
    setAmount("");
    setMessage("");
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
    const nextCard: Card = {
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

  function moveToNextPlayer() {
    if (!activePlayer) {
      return;
    }

    const activeIndex =
      players.findIndex(
        (player) =>
          player.id === activePlayer.id,
      );

    for (
      let offset = 1;
      offset <= players.length;
      offset += 1
    ) {
      const nextIndex =
        (activeIndex + offset) %
        players.length;

      const nextPlayer =
        players[nextIndex];

      if (
        !foldedPlayerIds.has(
          nextPlayer.id,
        )
      ) {
        setActivePlayerId(
          nextPlayer.id,
        );
        return;
      }
    }
  }

  function addAction() {
    if (!activePlayer) {
      setMessage(
        "行動したプレイヤーを選択してください。",
      );
      return;
    }

    if (!selectedAction) {
      setMessage(
        "アクションを選択してください。",
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
      selectedAction === "All-in" &&
      activeStartingStack <= 0
    ) {
      setMessage(
        "このプレイヤーのスタックを確認してください。",
      );
      return;
    }

    if (
      selectedAction === "All-in" &&
      activeRemainingStack <= 0
    ) {
      setMessage(
        "残りスタックがありません。",
      );
      return;
    }

    if (
      selectedAction === "Check" &&
      activeContribution <
        highestContribution
    ) {
      setMessage(
        "コールが必要なため、現在はチェックできません。",
      );
      return;
    }

    if (
      selectedAction === "Call" &&
      automaticCallAmount <= 0
    ) {
      setMessage(
        "現在はコールする金額がありません。",
      );
      return;
    }

    if (
      selectedAction === "Bet" &&
      highestContribution > 0
    ) {
      setMessage(
        "すでにベットがあるため、レイズを選択してください。",
      );
      return;
    }

    if (
      selectedAction === "Raise" &&
      highestContribution <= 0
    ) {
      setMessage(
        "まだベットがないため、ベットを選択してください。",
      );
      return;
    }

    if (
      selectedActionInfo?.needsAmount
    ) {
      const finalAmount =
        Number(amount);

      if (
        !Number.isFinite(finalAmount) ||
        finalAmount <=
          activeContribution
      ) {
        setMessage(
          "現在の投入額より大きい金額を入力してください。",
        );
        return;
      }

      if (
        finalAmount -
          activeContribution >
        activeRemainingStack
      ) {
        setMessage(
          "残りスタックを超える金額は入力できません。",
        );
        return;
      }

      if (
        selectedAction === "Raise" &&
        finalAmount <=
          highestContribution
      ) {
        setMessage(
          "レイズ額は現在の最高額より大きくしてください。",
        );
        return;
      }
    }

    const finalAmount =
      selectedAction === "Call"
        ? activeContribution +
          Math.min(
            automaticCallAmount,
            activeRemainingStack,
          )
        : selectedAction === "All-in"
          ? activeContribution +
            activeRemainingStack
          : selectedActionInfo?.needsAmount
            ? Number(amount)
            : activeContribution;

    const addedAmount =
      selectedAction === "Call"
        ? Math.min(
            automaticCallAmount,
            activeRemainingStack,
          )
        : selectedAction === "All-in"
          ? activeRemainingStack
          : selectedActionInfo?.needsAmount
            ? Math.max(
                0,
                finalAmount -
                  activeContribution,
              )
            : 0;

    const action: StreetAction = {
      id: crypto.randomUUID(),
      playerId: activePlayer.id,
      role: activePlayer.role,
      position:
        activePlayer.position,
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
      action,
    ]);

    setSelectedAction("");
    setAmount("");
    setMessage("");

    moveToNextPlayer();
  }

  function undoLastAction() {
    const lastAction =
      actions.at(-1);

    if (lastAction) {
      setActivePlayerId(
        lastAction.playerId,
      );
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
    setActions([]);
    setSelectedAction("");
    setAmount("");

    if (players.length > 0) {
      setActivePlayerId(
        players[0].id,
      );
    }

    localStorage.removeItem(draftKey);
    localStorage.removeItem(storageKey);

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
        `${japaneseTitle}のカードを選択してください。`,
      );
      return;
    }

    if (actions.length === 0) {
      setMessage(
        `${japaneseTitle}のアクションを入力してください。`,
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
        players,
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
            {board.map((card, index) => (
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
            ))}
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
                  className={`block text-3xl ${suit.color}`}
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
            行動したプレイヤー
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {players.map((player) => {
              const selected =
                player.id === activePlayerId;

              const folded =
                foldedPlayerIds.has(player.id);

              const contributed =
                contributions[player.id] ?? 0;

              const spentBefore =
                spentBeforeStreet[player.id] ?? 0;

              const remaining = Math.max(
                0,
                Number(player.stack) -
                  spentBefore -
                  contributed,
              );

              return (
                <button
                  key={player.id}
                  type="button"
                  disabled={folded}
                  onClick={() =>
                    selectPlayer(player.id)
                  }
                  className={`rounded-xl border p-4 text-left ${
                    folded
                      ? "cursor-not-allowed border-slate-800 bg-slate-950 text-slate-600"
                      : selected
                        ? player.role === "hero"
                          ? "border-emerald-500 bg-emerald-500 text-slate-950"
                          : "border-sky-400 bg-sky-500 text-slate-950"
                        : "border-slate-700 bg-slate-950"
                  }`}
                >
                  <span className="block font-bold">
                    {player.label}
                  </span>

                  <span className="mt-1 block text-xs">
                    残り：
                    {formatNumber(remaining)}
                  </span>
                </button>
              );
            })}
          </div>

          <h2 className="mt-6 text-lg font-bold">
            アクション
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {actionOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setSelectedAction(option.key);

                  if (!option.needsAmount) {
                    setAmount("");
                  }

                  setMessage("");
                }}
                className={`rounded-xl border p-3 text-left ${
                  selectedAction === option.key
                    ? "border-emerald-500 bg-emerald-500 text-slate-950"
                    : "border-slate-700 bg-slate-950"
                }`}
              >
                <span className="block font-bold">
                  {option.label}
                </span>

                <span className="mt-1 block text-xs">
                  {option.description}
                </span>
              </button>
            ))}
          </div>

          {selectedAction === "All-in" && (
            <div className="mt-5 rounded-xl border border-amber-800 bg-amber-950/30 p-4">
              <p className="text-sm text-amber-300">
                自動計算されるオールイン
              </p>

              <p className="mt-1 text-xl font-bold">
                追加 {formatNumber(activeRemainingStack)}
              </p>

              <p className="mt-1 text-sm text-slate-300">
                このストリートの最終投入額：
                {formatNumber(
                  activeContribution +
                    activeRemainingStack,
                )}
              </p>
            </div>
          )}

          {selectedAction === "Call" && (
            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">
                自動計算されるコール額
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-400">
                {formatNumber(
                  Math.min(
                    automaticCallAmount,
                    activeRemainingStack,
                  ),
                )}
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
                placeholder="例：1500"
                className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-2xl font-bold outline-none focus:border-emerald-500"
              />

              {amount && (
                <p className="mt-2 font-bold text-emerald-300">
                  今回の追加額：
                  {formatNumber(
                    previewAddedAmount,
                  )}

                  {previewPotPercent !== null &&
                    ` / ${Math.round(
                      previewPotPercent,
                    )}% Pot`}
                </p>
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
              disabled={actions.length === 0}
              className="text-sm font-bold text-amber-300 disabled:text-slate-600"
            >
              1つ戻る
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {actions.map((action, index) => (
              <div
                key={action.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-3"
              >
                <p className="font-bold">
                  {index + 1}. {action.position}
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  {
                    actionOptions.find(
                      (option) =>
                        option.key === action.action,
                    )?.label
                  }

                  {action.amount &&
                    ` ${formatNumber(action.amount)}`}

                  {action.addedAmount > 0 &&
                    `（追加 ${formatNumber(
                      action.addedAmount,
                    )}）`}
                </p>
              </div>
            ))}
          </div>
        </section>

        {message && (
          <p className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={saveAndNext}
            className="w-full rounded-2xl bg-emerald-500 p-5 text-lg font-bold text-slate-950"
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