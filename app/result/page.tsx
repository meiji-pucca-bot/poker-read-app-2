"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getModeStorageKey, getPokerMode } from "@/lib/pokerMode";

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

type ResultType = "win" | "lose" | "chop";

type Card = {
  rank: string;
  suit: string;
};

type Villain = {
  id: string;
  position: string;
  stack: string;
};

type ShowdownVillain = Villain & {
  selected: boolean;
  firstCard: Card;
  secondCard: Card;
};

type StoredTable = {
  id?: string;
  venue?: string;
  tableName?: string;
  smallBlind?: string;
  bigBlind?: string;
  heroStack?: string;
};

type TournamentSetup = {
  id?: string;
  tournamentName?: string;
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
  heroStack?: number;
  heroStackBb?: number;
  startingPlayers?: number;
  remainingPlayers?: number;
  paidPlaces?: number;
  registrationStatus?: "open" | "closed";
  averageStack?: number | null;
  currentRank?: number | null;
  phase?: string;
  considerIcm?: boolean;
  prizeStructure?: "standard" | "winner-take-all" | "unknown";
  createdAt?: string;
};

type StoredPositions = {
  heroPosition?: string;
  villains?: Villain[];
};

type StoredHeroHand = {
  firstCard?: Card;
  secondCard?: Card;
  notation?: string;
};

type StoredPreflop = {
  villains?: Villain[];
};

type ResultDraft = {
  result?: ResultType | "";
  showdown?: "yes" | "no" | "";
  villains?: ShowdownVillain[];
  activeVillainId?: string;
  activeCard?: 1 | 2;
  importance?: number;
  memo?: string;
};

const emptyCard: Card = {
  rank: "",
  suit: "",
};

function createEmptyCard(): Card {
  return {
    rank: "",
    suit: "",
  };
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

function handComplete(
  firstCard: Card,
  secondCard: Card,
) {
  return (
    Boolean(firstCard.rank) &&
    Boolean(firstCard.suit) &&
    Boolean(secondCard.rank) &&
    Boolean(secondCard.suit) &&
    !isSameCard(firstCard, secondCard)
  );
}

function formatNumber(value: string | number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString("ja-JP");
}

export default function ResultPage() {
  const router = useRouter();

  const [result, setResult] =
    useState<ResultType | "">("");

  const [showdown, setShowdown] =
    useState<"yes" | "no" | "">("");

  const [villains, setVillains] =
    useState<ShowdownVillain[]>([]);

  const [activeVillainId, setActiveVillainId] =
    useState("");

  const [activeCard, setActiveCard] =
    useState<1 | 2>(1);

  const [importance, setImportance] =
    useState(1);

  const [memo, setMemo] = useState("");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<"cash" | "tournament">("cash");
  const [tournamentSetup, setTournamentSetup] =
    useState<TournamentSetup | null>(null);

  useEffect(() => {
    const currentMode = getPokerMode();
    setMode(currentMode);

    const setup =
      currentMode === "tournament"
        ? safeParse<TournamentSetup>(
            "poker-read-tournament-current",
          )
        : null;

    setTournamentSetup(setup);

    const preflop = safeParse<StoredPreflop>(
      getModeStorageKey("poker-read-preflop"),
    );

    const positions = safeParse<StoredPositions>(
      getModeStorageKey("poker-read-positions"),
    );

    const savedVillains =
      Array.isArray(preflop?.villains) &&
      preflop.villains.length > 0
        ? preflop.villains
        : Array.isArray(positions?.villains)
          ? positions.villains
          : [];

    const loadedVillains: ShowdownVillain[] =
      savedVillains.map((villain) => ({
        ...villain,
        selected: false,
        firstCard: createEmptyCard(),
        secondCard: createEmptyCard(),
      }));

    const resultDraft = safeParse<ResultDraft>(
      getModeStorageKey("poker-read-result-draft"),
    );

    if (resultDraft) {
      setResult(resultDraft.result ?? "");
      setShowdown(resultDraft.showdown ?? "");
      setImportance(resultDraft.importance ?? 1);
      setMemo(resultDraft.memo ?? "");
      setActiveCard(resultDraft.activeCard ?? 1);

      if (
        Array.isArray(resultDraft.villains) &&
        resultDraft.villains.length > 0
      ) {
        setVillains(resultDraft.villains);
        setActiveVillainId(
          resultDraft.activeVillainId ||
            resultDraft.villains[0].id,
        );
      } else {
        setVillains(loadedVillains);
        if (loadedVillains.length > 0) {
          setActiveVillainId(loadedVillains[0].id);
        }
      }
    } else {
      setVillains(loadedVillains);
      if (loadedVillains.length > 0) {
        setActiveVillainId(loadedVillains[0].id);
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    const draft: ResultDraft = {
      result,
      showdown,
      villains,
      activeVillainId,
      activeCard,
      importance,
      memo,
    };

    localStorage.setItem(
      getModeStorageKey("poker-read-result-draft"),
      JSON.stringify(draft),
    );
  }, [
    result,
    showdown,
    villains,
    activeVillainId,
    activeCard,
    importance,
    memo,
    loaded,
  ]);

  const activeVillain = villains.find(
    (villain) =>
      villain.id === activeVillainId,
  );

  const selectedCard =
    activeCard === 1
      ? activeVillain?.firstCard ??
        emptyCard
      : activeVillain?.secondCard ??
        emptyCard;

  const selectedShowdownVillains =
    useMemo(
      () =>
        villains.filter(
          (villain) =>
            villain.selected,
        ),
      [villains],
    );

  const resultLabel = useMemo(() => {
    if (result === "win") {
      return "勝ち";
    }

    if (result === "lose") {
      return "負け";
    }

    if (result === "chop") {
      return "チョップ";
    }

    return "未選択";
  }, [result]);

  function toggleShowdownVillain(
    villainId: string,
  ) {
    setVillains((current) =>
      current.map((villain) =>
        villain.id === villainId
          ? {
              ...villain,
              selected:
                !villain.selected,
            }
          : villain,
      ),
    );

    setActiveVillainId(villainId);
    setActiveCard(1);
    setMessage("");
  }

  function updateRank(rank: string) {
    if (!activeVillain) {
      return;
    }

    setVillains((current) =>
      current.map((villain) => {
        if (
          villain.id !== activeVillain.id
        ) {
          return villain;
        }

        if (activeCard === 1) {
          return {
            ...villain,
            firstCard: {
              ...villain.firstCard,
              rank,
            },
          };
        }

        return {
          ...villain,
          secondCard: {
            ...villain.secondCard,
            rank,
          },
        };
      }),
    );

    setMessage("");
  }

  function updateSuit(suit: string) {
    if (!activeVillain) {
      return;
    }

    const nextCard: Card = {
      ...selectedCard,
      suit,
    };

    const otherCard =
      activeCard === 1
        ? activeVillain.secondCard
        : activeVillain.firstCard;

    if (
      isSameCard(nextCard, otherCard)
    ) {
      setMessage(
        "同じカードは2回選べません。",
      );
      return;
    }

    setVillains((current) =>
      current.map((villain) => {
        if (
          villain.id !== activeVillain.id
        ) {
          return villain;
        }

        if (activeCard === 1) {
          return {
            ...villain,
            firstCard: nextCard,
          };
        }

        return {
          ...villain,
          secondCard: nextCard,
        };
      }),
    );

    if (activeCard === 1) {
      setActiveCard(2);
    }

    setMessage("");
  }

  function clearVillainCards(
    villainId: string,
  ) {
    setVillains((current) =>
      current.map((villain) =>
        villain.id === villainId
          ? {
              ...villain,
              firstCard:
                createEmptyCard(),
              secondCard:
                createEmptyCard(),
            }
          : villain,
      ),
    );

    setActiveVillainId(villainId);
    setActiveCard(1);
    setMessage("");
  }

  function saveHand() {
    if (!result) {
      setMessage(
        "勝敗を選択してください。",
      );
      return;
    }

    if (!showdown) {
      setMessage(
        "ショーダウンの有無を選択してください。",
      );
      return;
    }

    if (
      showdown === "yes" &&
      selectedShowdownVillains.length === 0
    ) {
      setMessage(
        "ショーダウンした相手を1人以上選択してください。",
      );
      return;
    }

    const duplicateCardVillain =
      selectedShowdownVillains.find(
        (villain) =>
          isSameCard(
            villain.firstCard,
            villain.secondCard,
          ),
      );

    if (duplicateCardVillain) {
      setMessage(
        `${duplicateCardVillain.position}の同じカードが2回選択されています。`,
      );
      return;
    }

    const table =
      mode === "tournament"
        ? {
            id:
              tournamentSetup?.id ??
              crypto.randomUUID(),
            venue:
              tournamentSetup?.tournamentName ??
              "Tournament",
            tableName:
              tournamentSetup?.phase ?? "",
            smallBlind:
              tournamentSetup?.smallBlind !== undefined
                ? String(tournamentSetup.smallBlind)
                : "",
            bigBlind:
              tournamentSetup?.bigBlind !== undefined
                ? String(tournamentSetup.bigBlind)
                : "",
            heroStack:
              tournamentSetup?.heroStack !== undefined
                ? String(tournamentSetup.heroStack)
                : "",
          }
        : safeParse<StoredTable>(
            "poker-read-current-table",
          );

    const positions =
      safeParse<StoredPositions>(
        getModeStorageKey("poker-read-positions"),
      );

    const heroHand =
      safeParse<StoredHeroHand>(
        getModeStorageKey("poker-read-hero-hand"),
      );

    const preflop = safeParse<unknown>(
      getModeStorageKey("poker-read-preflop"),
    );

    const flop = safeParse<unknown>(
      getModeStorageKey("poker-read-flop"),
    );

    const turn = safeParse<unknown>(
      getModeStorageKey("poker-read-turn"),
    );

    const river = safeParse<unknown>(
      getModeStorageKey("poker-read-river"),
    );

    const savedAt =
      new Date().toISOString();

    const showdownPlayers =
      showdown === "yes"
        ? selectedShowdownVillains.map(
            (villain) => {
              const complete =
                handComplete(
                  villain.firstCard,
                  villain.secondCard,
                );

              return {
                id: villain.id,
                position:
                  villain.position,
                stack: villain.stack,
                handKnown: complete,
                firstCard: complete
                  ? villain.firstCard
                  : null,
                secondCard: complete
                  ? villain.secondCard
                  : null,
                handText: complete
                  ? `${cardText(
                      villain.firstCard,
                    )} ${cardText(
                      villain.secondCard,
                    )}`
                  : "不明",
              };
            },
          )
        : [];

    const hand = {
      id: crypto.randomUUID(),
      tableId:
        table?.id ??
        crypto.randomUUID(),
      savedAt,

      mode,
      tournament:
        mode === "tournament"
          ? tournamentSetup
          : undefined,
      table: table ?? {},
      positions: positions ?? {},
      heroHand: heroHand ?? {},

      preflop,
      flop,
      turn,
      river,

      result: {
        type: result,
        label: resultLabel,
        showdown,
        showdownPlayers,
        importance,
        memo: memo.trim(),
      },
    };

    const handsStorageKey =
      mode === "tournament"
        ? "poker-read-tournament-hands"
        : getModeStorageKey("poker-read-hands");

    const previousHands =
      safeParse<unknown[]>(
        handsStorageKey,
      );

    const hands = Array.isArray(
      previousHands,
    )
      ? previousHands
      : [];

    localStorage.setItem(
      handsStorageKey,
      JSON.stringify([
        hand,
        ...hands,
      ]),
    );

    [
      getModeStorageKey("poker-read-hero-hand"),
      "poker-read-hero-hand-draft",
      getModeStorageKey("poker-read-positions"),
      "poker-read-positions-draft",
      getModeStorageKey("poker-read-preflop"),
      "poker-read-preflop-draft",
      getModeStorageKey("poker-read-flop"),
      "poker-read-flop-draft",
      getModeStorageKey("poker-read-turn"),
      "poker-read-turn-draft",
      getModeStorageKey("poker-read-river"),
      "poker-read-river-draft",
      getModeStorageKey("poker-read-result-draft"),
    ].forEach((key) => {
      localStorage.removeItem(key);
    });

    router.push(
      mode === "tournament"
        ? "/tournament/history"
        : "/history",
    );
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        読み込み中...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link
            href="/river"
            className="mb-5 inline-block text-sm font-semibold text-slate-400"
          >
            ← リバーへ戻る
          </Link>

          <p className="mb-2 text-sm font-bold text-emerald-400">
            STEP 8 / 結果
          </p>

          {mode === "tournament" && (
            <div className="mb-3 rounded-2xl border border-amber-700/60 bg-amber-950/30 p-3">
              <p className="text-xs font-black text-amber-300">
                🏆 トーナメントモード
              </p>

              <p className="mt-1 text-sm text-white/70">
                {tournamentSetup?.tournamentName ||
                  "大会名未設定"}
              </p>
            </div>
          )}

          <h1 className="text-3xl font-bold">
            ハンドの結果を記録
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            勝敗、ショーダウンした相手、重要度を入力して保存します。
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-bold">
            勝敗
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setResult("win");
                setMessage("");
              }}
              className={`rounded-xl border p-4 font-bold ${
                result === "win"
                  ? "border-emerald-500 bg-emerald-500 text-slate-950"
                  : "border-slate-700 bg-slate-950"
              }`}
            >
              勝ち
            </button>

            <button
              type="button"
              onClick={() => {
                setResult("lose");
                setMessage("");
              }}
              className={`rounded-xl border p-4 font-bold ${
                result === "lose"
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-slate-700 bg-slate-950"
              }`}
            >
              負け
            </button>

            <button
              type="button"
              onClick={() => {
                setResult("chop");
                setMessage("");
              }}
              className={`rounded-xl border p-4 font-bold ${
                result === "chop"
                  ? "border-amber-400 bg-amber-400 text-slate-950"
                  : "border-slate-700 bg-slate-950"
              }`}
            >
              チョップ
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-bold">
            ショーダウン
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            相手のカードが公開されたかを選択します。
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setShowdown("yes");
                setMessage("");
              }}
              className={`rounded-xl border p-4 font-bold ${
                showdown === "yes"
                  ? "border-sky-400 bg-sky-500 text-slate-950"
                  : "border-slate-700 bg-slate-950"
              }`}
            >
              あり
            </button>

            <button
              type="button"
              onClick={() => {
                setShowdown("no");
                setMessage("");
              }}
              className={`rounded-xl border p-4 font-bold ${
                showdown === "no"
                  ? "border-sky-400 bg-sky-500 text-slate-950"
                  : "border-slate-700 bg-slate-950"
              }`}
            >
              なし
            </button>
          </div>
        </section>

        {showdown === "yes" && (
          <>
            <section className="mt-4 rounded-2xl border border-sky-900 bg-sky-950/30 p-5">
              <h2 className="text-lg font-bold text-sky-300">
                ショーダウンした相手
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                カードを見せた相手を選択してください。複数人選択できます。
              </p>

              {villains.length === 0 ? (
                <p className="mt-4 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-200">
                  プリフロップで登録した相手が見つかりません。
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {villains.map(
                    (villain) => (
                      <button
                        key={villain.id}
                        type="button"
                        onClick={() =>
                          toggleShowdownVillain(
                            villain.id,
                          )
                        }
                        className={`rounded-xl border p-4 text-left ${
                          villain.selected
                            ? "border-sky-400 bg-sky-500 text-slate-950"
                            : "border-slate-700 bg-slate-950"
                        }`}
                      >
                        <span className="block text-xl font-bold">
                          {villain.position}
                        </span>

                        <span className="mt-1 block text-sm">
                          スタック：
                          {formatNumber(
                            villain.stack,
                          )}
                        </span>

                        <span className="mt-2 block text-xs">
                          {villain.selected
                            ? "選択中"
                            : "タップして選択"}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              )}
            </section>

            {selectedShowdownVillains.length >
              0 && (
              <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="text-lg font-bold">
                  相手のハンド
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  ハンドが分かる相手だけ入力してください。不明のままでも保存できます。
                </p>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {selectedShowdownVillains.map(
                    (villain) => (
                      <button
                        key={villain.id}
                        type="button"
                        onClick={() => {
                          setActiveVillainId(
                            villain.id,
                          );
                          setActiveCard(1);
                        }}
                        className={`min-w-28 rounded-xl border p-3 ${
                          activeVillainId ===
                          villain.id
                            ? "border-sky-400 bg-sky-500 text-slate-950"
                            : "border-slate-700 bg-slate-950"
                        }`}
                      >
                        <span className="block font-bold">
                          {villain.position}
                        </span>

                        <span className="mt-1 block text-xs">
                          {handComplete(
                            villain.firstCard,
                            villain.secondCard,
                          )
                            ? `${cardText(
                                villain.firstCard,
                              )} ${cardText(
                                villain.secondCard,
                              )}`
                            : "ハンド不明"}
                        </span>
                      </button>
                    ),
                  )}
                </div>

                {activeVillain?.selected && (
                  <>
                    <div className="mt-4 rounded-xl border border-sky-900 bg-sky-950/30 p-4">
                      <p className="text-sm text-slate-400">
                        入力中の相手
                      </p>

                      <p className="mt-1 text-xl font-bold text-sky-300">
                        {activeVillain.position}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveCard(1)
                        }
                        className={`rounded-2xl border p-5 ${
                          activeCard === 1
                            ? "border-sky-400 bg-sky-950/40"
                            : "border-slate-700 bg-slate-950"
                        }`}
                      >
                        <span className="block text-xs text-slate-400">
                          1枚目
                        </span>

                        <span className="mt-2 block text-3xl font-bold">
                          {cardText(
                            activeVillain.firstCard,
                          )}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveCard(2)
                        }
                        className={`rounded-2xl border p-5 ${
                          activeCard === 2
                            ? "border-sky-400 bg-sky-950/40"
                            : "border-slate-700 bg-slate-950"
                        }`}
                      >
                        <span className="block text-xs text-slate-400">
                          2枚目
                        </span>

                        <span className="mt-2 block text-3xl font-bold">
                          {cardText(
                            activeVillain.secondCard,
                          )}
                        </span>
                      </button>
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
                            updateRank(rank)
                          }
                          className={`rounded-xl border py-3 font-bold ${
                            selectedCard.rank ===
                            rank
                              ? "border-sky-400 bg-sky-500 text-slate-950"
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
                            updateSuit(
                              suit.symbol,
                            )
                          }
                          className={`rounded-xl border py-3 ${
                            selectedCard.suit ===
                            suit.symbol
                              ? "border-sky-400 bg-sky-500 text-slate-950"
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

                    <button
                      type="button"
                      onClick={() =>
                        clearVillainCards(
                          activeVillain.id,
                        )
                      }
                      className="mt-4 w-full rounded-xl border border-slate-700 p-3 font-bold text-slate-300"
                    >
                      この相手のカードをクリア
                    </button>
                  </>
                )}
              </section>
            )}
          </>
        )}

        <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-bold">
            このハンドの重要度
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            後で見返したいほど星を多くします。
          </p>

          <div className="mt-4 flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map(
              (star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setImportance(star)
                  }
                  className={`flex-1 rounded-xl border py-4 text-2xl ${
                    star <= importance
                      ? "border-amber-400 bg-amber-400 text-slate-950"
                      : "border-slate-700 bg-slate-950 text-slate-500"
                  }`}
                >
                  ★
                </button>
              ),
            )}
          </div>

          <p className="mt-3 text-sm text-amber-300">
            {"★".repeat(importance)}
            {"☆".repeat(
              5 - importance,
            )}
          </p>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <label
            htmlFor="memo"
            className="block text-lg font-bold"
          >
            メモ
            <span className="ml-2 text-sm font-normal text-slate-400">
              任意
            </span>
          </label>

          <p className="mt-1 text-sm text-slate-400">
            読みが外れた理由や、後で確認したいことを書きます。
          </p>

          <textarea
            id="memo"
            value={memo}
            onChange={(event) =>
              setMemo(event.target.value)
            }
            placeholder="例：リバーでブラフを多く見すぎた"
            rows={4}
            className="mt-3 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-4 outline-none focus:border-emerald-500"
          />
        </section>

        {message && (
          <p className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={saveHand}
          className="mt-6 w-full rounded-2xl bg-emerald-500 p-5 text-lg font-bold text-slate-950 active:scale-95"
        >
          ハンドを保存
        </button>
      </div>
    </main>
  );
}