"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Card = {
  rank?: string;
  suit?: string;
};

type Villain = {
  id?: string;
  position?: string;
  stack?: string;
};

type StoredAction = {
  id?: string;
  playerId?: string;
  role?: "hero" | "villain";
  position?: string;
  actor?: "hero" | "villain";
  action?: string;
  amount?: string;
  addedAmount?: number;
  potBefore?: number;
  potPercent?: number | null;
};

type StoredStreet = {
  startingPot?: number;
  endingPot?: number;
  board?: Card[];
  actions?: StoredAction[];
};

type ShowdownPlayer = {
  id?: string;
  position?: string;
  stack?: string;
  handKnown?: boolean;
  firstCard?: Card | null;
  secondCard?: Card | null;
  handText?: string;
};

type StoredHand = {
  id: string;
  savedAt: string;

  table?: {
    venue?: string;
    tableName?: string;
    smallBlind?: string;
    bigBlind?: string;
    heroStack?: string;
  };

  positions?: {
    heroPosition?: string;
    villainPosition?: string;
    villains?: Villain[];
  };

  heroHand?: {
    firstCard?: Card;
    secondCard?: Card;
    notation?: string;
  };

  preflop?: {
    endingPot?: number;
    villains?: Villain[];
    actions?: StoredAction[];
  };

  flop?: StoredStreet;
  turn?: StoredStreet;
  river?: StoredStreet;

  result?: {
    type?: "win" | "lose" | "chop";
    label?: string;
    showdown?: "yes" | "no";
    showdownPlayers?: ShowdownPlayer[];
    importance?: number;
    memo?: string;

    // 旧データとの互換用
    villainHand?: {
      firstCard?: Card;
      secondCard?: Card;
      text?: string;
    } | null;
  };
};

function safeParseHands(): StoredHand[] {
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

function cardText(card?: Card | null) {
  if (!card?.rank || !card?.suit) {
    return "?";
  }

  return `${card.rank}${card.suit}`;
}

function boardText(street?: StoredStreet) {
  if (!street?.board?.length) {
    return "";
  }

  return street.board
    .map(cardText)
    .join(" ");
}

function formatDate(dateText: string) {
  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return dateText;
  }

  return new Intl.DateTimeFormat(
    "ja-JP",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function formatNumber(
  value?: string | number,
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return value ?? "";
  }

  return number.toLocaleString("ja-JP");
}

function actionJapanese(
  action?: string,
) {
  const labels: Record<string, string> = {
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

  return action
    ? labels[action] ?? action
    : "不明";
}

function resultStyle(type?: string) {
  if (type === "win") {
    return {
      label: "勝ち",
      className:
        "border-emerald-800 bg-emerald-950/40 text-emerald-300",
    };
  }

  if (type === "lose") {
    return {
      label: "負け",
      className:
        "border-red-900 bg-red-950/40 text-red-300",
    };
  }

  return {
    label: "チョップ",
    className:
      "border-amber-800 bg-amber-950/40 text-amber-300",
  };
}

function getVillains(
  hand: StoredHand,
) {
  if (
    Array.isArray(
      hand.preflop?.villains,
    ) &&
    hand.preflop!.villains!.length >
      0
  ) {
    return hand.preflop!.villains!;
  }

  if (
    Array.isArray(
      hand.positions?.villains,
    )
  ) {
    return hand.positions!.villains!;
  }

  if (
    hand.positions?.villainPosition
  ) {
    return [
      {
        position:
          hand.positions
            .villainPosition,
        stack: "",
      },
    ];
  }

  return [];
}

function getShowdownPlayers(
  hand: StoredHand,
): ShowdownPlayer[] {
  if (
    Array.isArray(
      hand.result?.showdownPlayers,
    )
  ) {
    return hand.result!
      .showdownPlayers!;
  }

  if (
    hand.result?.villainHand
  ) {
    return [
      {
        position:
          hand.positions
            ?.villainPosition ??
          "相手",
        handKnown: true,
        firstCard:
          hand.result.villainHand
            .firstCard,
        secondCard:
          hand.result.villainHand
            .secondCard,
        handText:
          hand.result.villainHand
            .text,
      },
    ];
  }

  return [];
}

function actorLabel(
  action: StoredAction,
  hand: StoredHand,
) {
  const heroPosition =
    hand.positions?.heroPosition;

  if (
    action.role === "hero" ||
    action.actor === "hero" ||
    action.position === heroPosition
  ) {
    return `自分${
      action.position
        ? `（${action.position}）`
        : heroPosition
          ? `（${heroPosition}）`
          : ""
    }`;
  }

  if (
    action.position
  ) {
    return `相手（${action.position}）`;
  }

  return "相手";
}

function ActionList({
  title,
  actions,
  hand,
}: {
  title: string;
  actions?: StoredAction[];
  hand: StoredHand;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <h4 className="font-bold">
        {title}
      </h4>

      {!actions?.length ? (
        <p className="mt-2 text-sm text-slate-500">
          アクションなし
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {actions.map(
            (action, index) => (
              <div
                key={
                  action.id ??
                  `${title}-${index}`
                }
                className="rounded-xl bg-slate-900 p-3"
              >
                <p className="text-sm font-bold">
                  {index + 1}.{" "}
                  {actorLabel(
                    action,
                    hand,
                  )}
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  {actionJapanese(
                    action.action,
                  )}

                  {action.amount
                    ? ` ${formatNumber(
                        action.amount,
                      )}`
                    : ""}

                  {typeof action.addedAmount ===
                    "number" &&
                  action.addedAmount > 0
                    ? `（追加 ${formatNumber(
                        action.addedAmount,
                      )}`
                    : ""}

                  {typeof action.potPercent ===
                    "number" &&
                  action.addedAmount &&
                  action.addedAmount > 0
                    ? ` / ${Math.round(
                        action.potPercent,
                      )}% Pot`
                    : ""}

                  {typeof action.addedAmount ===
                    "number" &&
                  action.addedAmount > 0
                    ? "）"
                    : ""}
                </p>

                {typeof action.potBefore ===
                  "number" &&
                  typeof action.addedAmount ===
                    "number" && (
                    <p className="mt-1 text-xs text-slate-500">
                      アクション後ポット：
                      {formatNumber(
                        action.potBefore +
                          action.addedAmount,
                      )}
                    </p>
                  )}
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}

function StreetSummary({
  title,
  street,
}: {
  title: string;
  street?: StoredStreet;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <h3 className="font-bold">
        {title}
      </h3>

      <p className="mt-2 text-xl font-bold">
        {boardText(street) ||
          "未入力"}
      </p>

      <p className="mt-3 text-sm text-slate-400">
        開始ポット：
        {formatNumber(
          street?.startingPot,
        ) || "不明"}
      </p>

      <p className="mt-1 text-sm text-slate-400">
        終了ポット：
        {formatNumber(
          street?.endingPot,
        ) || "不明"}
      </p>
    </section>
  );
}

export default function HistoryPage() {
  const [hands, setHands] =
    useState<StoredHand[]>([]);

  const [openHandId, setOpenHandId] =
    useState<string | null>(null);

  const [loaded, setLoaded] =
    useState(false);

  useEffect(() => {
    setHands(safeParseHands());
    setLoaded(true);
  }, []);

  const totalWins = useMemo(
    () =>
      hands.filter(
        (hand) =>
          hand.result?.type ===
          "win",
      ).length,
    [hands],
  );

  function deleteHand(
    handId: string,
  ) {
    const confirmed =
      window.confirm(
        "このハンドを削除しますか？",
      );

    if (!confirmed) {
      return;
    }

    const nextHands =
      hands.filter(
        (hand) =>
          hand.id !== handId,
      );

    setHands(nextHands);

    localStorage.setItem(
      "poker-read-hands",
      JSON.stringify(nextHands),
    );

    if (openHandId === handId) {
      setOpenHandId(null);
    }
  }

  function deleteAllHands() {
    const confirmed =
      window.confirm(
        "保存したハンドをすべて削除しますか？この操作は元に戻せません。",
      );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      "poker-read-hands",
    );

    setHands([]);
    setOpenHandId(null);
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
            href="/"
            className="mb-5 inline-block text-sm font-semibold text-slate-400"
          >
            ← ホームへ戻る
          </Link>

          <p className="mb-2 text-sm font-bold text-emerald-400">
            HAND HISTORY
          </p>

          <h1 className="text-3xl font-bold">
            保存したハンド
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            ハンドを開くと、複数の相手と各ストリートの行動を確認できます。
          </p>
        </header>

        <section className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">
              保存
            </p>

            <p className="mt-1 text-2xl font-bold">
              {hands.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">
              勝ち
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-400">
              {totalWins}
            </p>
          </div>

          <Link
            href="/new-hand"
            className="rounded-2xl bg-emerald-500 p-4 font-bold text-slate-950 active:scale-95"
          >
            <span className="block text-xs">
              NEW
            </span>

            <span className="mt-1 block">
              新規
            </span>
          </Link>
        </section>

        {hands.length === 0 ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
            <p className="text-lg font-bold">
              保存したハンドはありません
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              ハンドを記録すると、ここに表示されます。
            </p>

            <Link
              href="/new-hand"
              className="mt-5 block rounded-xl bg-emerald-500 p-4 font-bold text-slate-950"
            >
              最初のハンドを記録
            </Link>
          </section>
        ) : (
          <div className="space-y-4">
            {hands.map((hand) => {
              const style =
                resultStyle(
                  hand.result?.type,
                );

              const isOpen =
                openHandId === hand.id;

              const importance =
                hand.result?.importance ??
                1;

              const villains =
                getVillains(hand);

              const showdownPlayers =
                getShowdownPlayers(
                  hand,
                );

              const heroHandText =
                hand.heroHand
                  ?.notation ||
                `${cardText(
                  hand.heroHand
                    ?.firstCard,
                )} ${cardText(
                  hand.heroHand
                    ?.secondCard,
                )}`;

              const fullBoard = [
                boardText(hand.flop),
                boardText(hand.turn),
                boardText(hand.river),
              ]
                .filter(Boolean)
                .join(" / ");

              return (
                <article
                  key={hand.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenHandId(
                        isOpen
                          ? null
                          : hand.id,
                      )
                    }
                    className="w-full p-5 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-amber-300">
                          {"★".repeat(
                            importance,
                          )}
                          {"☆".repeat(
                            Math.max(
                              0,
                              5 -
                                importance,
                            ),
                          )}
                        </p>

                        <h2 className="mt-2 text-2xl font-bold">
                          {heroHandText ||
                            "不明"}
                        </h2>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-bold ${style.className}`}
                      >
                        {style.label}
                      </span>
                    </div>

                    <p className="mt-3 font-bold text-emerald-300">
                      自分：
                      {hand.positions
                        ?.heroPosition ??
                        "不明"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {villains.length >
                      0 ? (
                        villains.map(
                          (
                            villain,
                            index,
                          ) => (
                            <span
                              key={
                                villain.id ??
                                `${villain.position}-${index}`
                              }
                              className="rounded-full border border-sky-900 bg-sky-950/30 px-3 py-1 text-xs font-bold text-sky-300"
                            >
                              相手：
                              {villain.position ??
                                "不明"}
                            </span>
                          ),
                        )
                      ) : (
                        <span className="text-sm text-slate-500">
                          相手情報なし
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm text-slate-400">
                      {hand.table?.venue ||
                        "開催場所未入力"}

                      {hand.table
                        ?.tableName
                        ? ` / ${hand.table.tableName}`
                        : ""}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      SB / BB：
                      {hand.table
                        ?.smallBlind ??
                        "?"}
                      {" / "}
                      {hand.table
                        ?.bigBlind ??
                        "?"}
                    </p>

                    {fullBoard && (
                      <p className="mt-3 rounded-xl bg-slate-950 p-3 text-lg font-bold">
                        {fullBoard}
                      </p>
                    )}

                    <p className="mt-3 text-xs text-slate-500">
                      {formatDate(
                        hand.savedAt,
                      )}
                    </p>

                    <p className="mt-3 text-center text-sm font-bold text-emerald-400">
                      {isOpen
                        ? "詳細を閉じる ▲"
                        : "詳細を見る ▼"}
                    </p>
                  </button>

                  {isOpen && (
                    <div className="space-y-4 border-t border-slate-800 p-5">
                      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <h3 className="font-bold">
                          ハンド情報
                        </h3>

                        <p className="mt-3 text-sm">
                          自分：
                          <span className="ml-2 font-bold text-emerald-400">
                            {cardText(
                              hand.heroHand
                                ?.firstCard,
                            )}
                            {" "}
                            {cardText(
                              hand.heroHand
                                ?.secondCard,
                            )}
                          </span>
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
                          自分のスタック：
                          <span className="ml-1 font-bold text-white">
                            {formatNumber(
                              hand.table
                                ?.heroStack,
                            ) ||
                              "不明"}
                          </span>
                        </p>
                      </section>

                      <section className="rounded-2xl border border-sky-900 bg-sky-950/20 p-4">
                        <h3 className="font-bold text-sky-300">
                          対戦相手
                        </h3>

                        {villains.length ===
                        0 ? (
                          <p className="mt-2 text-sm text-slate-500">
                            相手情報なし
                          </p>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {villains.map(
                              (
                                villain,
                                index,
                              ) => (
                                <div
                                  key={
                                    villain.id ??
                                    `${villain.position}-${index}`
                                  }
                                  className="rounded-xl bg-slate-950 p-3"
                                >
                                  <p className="font-bold text-sky-300">
                                    {villain.position ??
                                      "不明"}
                                  </p>

                                  <p className="mt-1 text-sm text-slate-300">
                                    スタック：
                                    {formatNumber(
                                      villain.stack,
                                    ) ||
                                      "不明"}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </section>

                      <ActionList
                        title="プリフロップ"
                        actions={
                          hand.preflop
                            ?.actions
                        }
                        hand={hand}
                      />

                      <StreetSummary
                        title="フロップ"
                        street={hand.flop}
                      />

                      <ActionList
                        title="フロップのアクション"
                        actions={
                          hand.flop
                            ?.actions
                        }
                        hand={hand}
                      />

                      <StreetSummary
                        title="ターン"
                        street={hand.turn}
                      />

                      <ActionList
                        title="ターンのアクション"
                        actions={
                          hand.turn
                            ?.actions
                        }
                        hand={hand}
                      />

                      <StreetSummary
                        title="リバー"
                        street={hand.river}
                      />

                      <ActionList
                        title="リバーのアクション"
                        actions={
                          hand.river
                            ?.actions
                        }
                        hand={hand}
                      />

                      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <h3 className="font-bold">
                          ショーダウン
                        </h3>

                        <p className="mt-2 text-sm">
                          {hand.result
                            ?.showdown ===
                          "yes"
                            ? "あり"
                            : "なし"}
                        </p>

                        {hand.result
                          ?.showdown ===
                          "yes" && (
                          <div className="mt-3 space-y-2">
                            {showdownPlayers.length >
                            0 ? (
                              showdownPlayers.map(
                                (
                                  player,
                                  index,
                                ) => (
                                  <div
                                    key={
                                      player.id ??
                                      `${player.position}-${index}`
                                    }
                                    className="rounded-xl border border-sky-900 bg-sky-950/20 p-3"
                                  >
                                    <p className="font-bold text-sky-300">
                                      {player.position ??
                                        "相手"}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-300">
                                      ハンド：
                                      {player.handKnown
                                        ? player.handText ||
                                          `${cardText(
                                            player.firstCard,
                                          )} ${cardText(
                                            player.secondCard,
                                          )}`
                                        : "不明"}
                                    </p>
                                  </div>
                                ),
                              )
                            ) : (
                              <p className="text-sm text-slate-500">
                                相手ハンド不明
                              </p>
                            )}
                          </div>
                        )}
                      </section>

                      {hand.result
                        ?.memo && (
                        <section className="rounded-2xl border border-amber-900 bg-amber-950/30 p-4">
                          <h3 className="font-bold text-amber-300">
                            メモ
                          </h3>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                            {
                              hand.result
                                .memo
                            }
                          </p>
                        </section>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          deleteHand(
                            hand.id,
                          )
                        }
                        className="w-full rounded-xl border border-red-900 bg-red-950/30 p-4 font-bold text-red-300"
                      >
                        このハンドを削除
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {hands.length > 0 && (
          <button
            type="button"
            onClick={deleteAllHands}
            className="mt-8 w-full rounded-xl border border-red-950 p-4 text-sm font-bold text-red-400"
          >
            保存したハンドをすべて削除
          </button>
        )}
      </div>
    </main>
  );
}