"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const tablePositions = [
  "UTG",
  "MP",
  "HJ",
  "CO",
  "BTN",
  "SB",
  "BB",
] as const;

type Position = (typeof tablePositions)[number];

type ActionType =
  | "Fold"
  | "Check"
  | "Limp"
  | "Call"
  | "Open"
  | "3BET"
  | "4BET"
  | "All-in";

type PreflopAction = {
  id: string;
  position: Position;
  action: ActionType;
  amount: string;
};

type SavedPositions = {
  heroPosition: Position | "";
  villainPosition: Position | "";
};

type SavedTable = {
  smallBlind?: string;
  bigBlind?: string;
};

type ContributionMap = Record<Position, number>;

const actionOptions: {
  key: ActionType;
  label: string;
  description: string;
  needsAmount: boolean;
}[] = [
  {
    key: "Fold",
    label: "フォールド",
    description: "降りる",
    needsAmount: false,
  },
  {
    key: "Check",
    label: "チェック",
    description: "追加せずに回す",
    needsAmount: false,
  },
  {
    key: "Limp",
    label: "リンプ",
    description: "BBと同額で参加",
    needsAmount: false,
  },
  {
    key: "Call",
    label: "コール",
    description: "現在の最高額に合わせる",
    needsAmount: false,
  },
  {
    key: "Open",
    label: "オープン",
    description: "最初のレイズ",
    needsAmount: true,
  },
  {
    key: "3BET",
    label: "3ベット",
    description: "レイズへの再レイズ",
    needsAmount: true,
  },
  {
    key: "4BET",
    label: "4ベット",
    description: "3ベットへの再レイズ",
    needsAmount: true,
  },
  {
    key: "All-in",
    label: "オールイン",
    description: "残りスタックをすべて賭ける",
    needsAmount: true,
  },
];

function formatNumber(value: string | number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString("ja-JP");
}

function amountToBb(amount: string | number, bigBlind: string) {
  const amountNumber = Number(amount);
  const bbNumber = Number(bigBlind);

  if (
    !bigBlind ||
    !Number.isFinite(amountNumber) ||
    !Number.isFinite(bbNumber) ||
    bbNumber <= 0
  ) {
    return null;
  }

  return amountNumber / bbNumber;
}

function calculatePreflopPot(
  actions: PreflopAction[],
  smallBlind: string,
  bigBlind: string,
) {
  const contributions: ContributionMap = {
    UTG: 0,
    MP: 0,
    HJ: 0,
    CO: 0,
    BTN: 0,
    SB: Number(smallBlind) || 0,
    BB: Number(bigBlind) || 0,
  };

  let highestContribution = Math.max(
    ...Object.values(contributions),
  );

  actions.forEach((action) => {
    const currentContribution =
      contributions[action.position];

    if (
      action.action === "Fold" ||
      action.action === "Check"
    ) {
      return;
    }

    if (action.action === "Limp") {
      contributions[action.position] = Math.max(
        currentContribution,
        Number(bigBlind) || 0,
      );
    } else if (action.action === "Call") {
      contributions[action.position] = Math.max(
        currentContribution,
        highestContribution,
      );
    } else {
      const finalAmount = Number(action.amount) || 0;

      contributions[action.position] = Math.max(
        currentContribution,
        finalAmount,
      );
    }

    highestContribution = Math.max(
      highestContribution,
      contributions[action.position],
    );
  });

  const pot = Object.values(contributions).reduce(
    (total, value) => total + value,
    0,
  );

  return {
    pot,
    highestContribution,
    contributions,
  };
}

export default function PreflopPage() {
  const [heroPosition, setHeroPosition] =
    useState<Position | "">("");

  const [villainPosition, setVillainPosition] =
    useState<Position | "">("");

  const [smallBlind, setSmallBlind] = useState("");
  const [bigBlind, setBigBlind] = useState("");

  const [actions, setActions] = useState<PreflopAction[]>(
    [],
  );

  const [activePosition, setActivePosition] =
    useState<Position>("UTG");

  const [selectedAction, setSelectedAction] =
    useState<ActionType | "">("");

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedPositions = localStorage.getItem(
      "poker-read-positions",
    );

    if (savedPositions) {
      try {
        const parsed = JSON.parse(
          savedPositions,
        ) as SavedPositions;

        setHeroPosition(parsed.heroPosition);
        setVillainPosition(parsed.villainPosition);
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
        ) as SavedTable;

        setSmallBlind(parsed.smallBlind ?? "");
        setBigBlind(parsed.bigBlind ?? "");
      } catch {
        setMessage(
          "テーブル情報を読み込めませんでした。",
        );
      }
    }

    const savedDraft = localStorage.getItem(
      "poker-read-preflop-draft",
    );

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as {
          actions?: PreflopAction[];
        };

        setActions(parsed.actions ?? []);
      } catch {
        localStorage.removeItem(
          "poker-read-preflop-draft",
        );
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    localStorage.setItem(
      "poker-read-preflop-draft",
      JSON.stringify({ actions }),
    );
  }, [actions, loaded]);

  const selectedOption = actionOptions.find(
    (option) => option.key === selectedAction,
  );

  const enteredBb = useMemo(
    () => amountToBb(amount, bigBlind),
    [amount, bigBlind],
  );

  const preflopState = useMemo(
    () =>
      calculatePreflopPot(
        actions,
        smallBlind,
        bigBlind,
      ),
    [actions, smallBlind, bigBlind],
  );

  function addAction() {
    if (!selectedAction) {
      setMessage("アクションを選んでください。");
      return;
    }

    if (selectedOption?.needsAmount && !amount) {
      setMessage("金額を入力してください。");
      return;
    }

    let resolvedAmount = "";

    if (selectedAction === "Limp") {
      resolvedAmount = bigBlind;
    } else if (selectedAction === "Call") {
      resolvedAmount =
        preflopState.highestContribution.toString();
    } else if (selectedOption?.needsAmount) {
      resolvedAmount = amount;
    }

    const newAction: PreflopAction = {
      id: crypto.randomUUID(),
      position: activePosition,
      action: selectedAction,
      amount: resolvedAmount,
    };

    setActions((current) => [...current, newAction]);
    setSelectedAction("");
    setAmount("");
    setMessage("");

    const currentIndex =
      tablePositions.indexOf(activePosition);

    if (currentIndex < tablePositions.length - 1) {
      setActivePosition(
        tablePositions[currentIndex + 1],
      );
    }
  }

  function foldUntilHero() {
    if (!heroPosition) {
      setMessage(
        "先にポジション画面で自分の位置を選んでください。",
      );
      return;
    }

    const heroIndex =
      tablePositions.indexOf(heroPosition);

    const existingPositions = new Set(
      actions.map((action) => action.position),
    );

    const folds: PreflopAction[] = tablePositions
      .slice(0, heroIndex)
      .filter(
        (position) =>
          !existingPositions.has(position),
      )
      .map((position) => ({
        id: crypto.randomUUID(),
        position,
        action: "Fold",
        amount: "",
      }));

    setActions((current) => [...current, ...folds]);
    setActivePosition(heroPosition);
    setMessage("");
  }

  function undoLastAction() {
    const lastAction = actions.at(-1);

    if (lastAction) {
      setActivePosition(lastAction.position);
    }

    setActions((current) => current.slice(0, -1));
    setMessage("");
  }

  function clearActions() {
    setActions([]);
    localStorage.removeItem(
      "poker-read-preflop-draft",
    );

    setActivePosition("UTG");
    setSelectedAction("");
    setAmount("");
    setMessage(
      "プリフロップ入力をクリアしました。",
    );
  }

  function savePreflop() {
    if (actions.length === 0) {
      setMessage(
        "プリフロップのアクションを1つ以上入力してください。",
      );
      return false;
    }

    localStorage.setItem(
      "poker-read-preflop",
      JSON.stringify({
        actions,
        endingPot: preflopState.pot,
        contributions:
          preflopState.contributions,
        savedAt: new Date().toISOString(),
      }),
    );

    return true;
  }

  function actorLabel(position: Position) {
    if (position === heroPosition) {
      return `${position}（自分）`;
    }

    if (position === villainPosition) {
      return `${position}（相手）`;
    }

    return position;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link
            href="/positions"
            className="mb-5 inline-block text-sm font-semibold text-slate-400"
          >
            ← 前の画面へ戻る
          </Link>

          <p className="mb-2 text-sm font-bold text-emerald-400">
            STEP 4 / プリフロップ
          </p>

          <h1 className="text-3xl font-bold">
            プリフロップを記録
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            カードが配られてからフロップが開くまでの行動を、
            順番に入力します。
          </p>
        </header>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-1/2 rounded-full bg-emerald-500" />
        </div>

        <section className="mb-4 grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-slate-900 p-3">
            <p className="text-xs text-slate-400">
              自分
            </p>
            <p className="mt-1 font-bold text-emerald-400">
              {heroPosition || "未選択"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-3">
            <p className="text-xs text-slate-400">
              相手
            </p>
            <p className="mt-1 font-bold text-sky-400">
              {villainPosition || "未選択"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-3">
            <p className="text-xs text-slate-400">
              SB
            </p>
            <p className="mt-1 font-bold">
              {smallBlind || "未入力"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-3">
            <p className="text-xs text-slate-400">
              BB
            </p>
            <p className="mt-1 font-bold">
              {bigBlind || "未入力"}
            </p>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-emerald-900 bg-emerald-950/40 p-5">
          <p className="text-sm text-emerald-300">
            現在のポット
          </p>

          <p className="mt-1 text-3xl font-bold">
            {formatNumber(preflopState.pot)}
          </p>

          <p className="mt-2 text-sm text-slate-300">
            {bigBlind && Number(bigBlind) > 0
              ? `${Number(
                  (
                    preflopState.pot /
                    Number(bigBlind)
                  ).toFixed(2),
                )}bb`
              : "BBを入力するとBB換算されます"}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            SB・BBと、入力済みのアクションから自動計算しています。
          </p>
        </section>

        <button
          type="button"
          onClick={foldUntilHero}
          className="mb-4 w-full rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 font-bold text-emerald-300"
        >
          自分の手前まで全員フォールド
        </button>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-bold">
            行動したポジション
          </h2>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {tablePositions.map((position) => (
              <button
                key={position}
                type="button"
                onClick={() =>
                  setActivePosition(position)
                }
                className={`rounded-xl border py-3 font-bold ${
                  activePosition === position
                    ? position === heroPosition
                      ? "border-emerald-500 bg-emerald-500 text-slate-950"
                      : position === villainPosition
                        ? "border-sky-400 bg-sky-500 text-slate-950"
                        : "border-white bg-white text-slate-950"
                    : "border-slate-700 bg-slate-950"
                }`}
              >
                {position}
              </button>
            ))}
          </div>

          <p className="mt-3 text-sm text-slate-400">
            入力中：
            <span className="ml-1 font-bold text-white">
              {actorLabel(activePosition)}
            </span>
          </p>

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
                  setMessage("");

                  if (!option.needsAmount) {
                    setAmount("");
                  }
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

          {selectedOption?.needsAmount && (
            <div className="mt-5">
              <label
                htmlFor="amount"
                className="mb-2 block font-bold"
              >
                最終的な金額
              </label>

              <p className="mb-2 text-sm text-slate-400">
                実額を入力します。例：250
              </p>

              <input
                id="amount"
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
                placeholder="250"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-2xl font-bold outline-none focus:border-emerald-500"
              />

              {amount && (
                <p className="mt-2 font-bold text-emerald-400">
                  {formatNumber(amount)}
                  {enteredBb !== null
                    ? `（${Number(
                        enteredBb.toFixed(2),
                      )}bb）`
                    : ""}
                </p>
              )}
            </div>
          )}

          {(selectedAction === "Call" ||
            selectedAction === "Limp") && (
            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">
                自動入力される金額
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-400">
                {selectedAction === "Limp"
                  ? `${formatNumber(
                      bigBlind || 0,
                    )}${
                      bigBlind
                        ? "（1bb）"
                        : ""
                    }`
                  : `${formatNumber(
                      preflopState.highestContribution,
                    )}${
                      bigBlind &&
                      Number(bigBlind) > 0
                        ? `（${Number(
                            (
                              preflopState.highestContribution /
                              Number(bigBlind)
                            ).toFixed(2),
                          )}bb）`
                        : ""
                    }`}
              </p>
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

          {actions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              まだアクションがありません。
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {actions.map((action, index) => {
                const bb = amountToBb(
                  action.amount,
                  bigBlind,
                );

                return (
                  <div
                    key={action.id}
                    className={`rounded-xl border p-3 ${
                      action.position ===
                      heroPosition
                        ? "border-emerald-800 bg-emerald-950/30"
                        : action.position ===
                            villainPosition
                          ? "border-sky-900 bg-sky-950/30"
                          : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    <p className="text-sm font-bold">
                      {index + 1}.{" "}
                      {actorLabel(
                        action.position,
                      )}
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {
                        actionOptions.find(
                          (option) =>
                            option.key ===
                            action.action,
                        )?.label
                      }

                      {action.amount &&
                        ` ${formatNumber(
                          action.amount,
                        )}`}

                      {bb !== null &&
                        `（${Number(
                          bb.toFixed(2),
                        )}bb）`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {message && (
          <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <Link
            href={
              actions.length > 0 ? "/flop" : "#"
            }
            onClick={(event) => {
              if (!savePreflop()) {
                event.preventDefault();
              }
            }}
            className={`block w-full rounded-2xl p-5 text-center text-lg font-bold ${
              actions.length > 0
                ? "bg-emerald-500 text-slate-950 active:scale-95"
                : "cursor-not-allowed bg-slate-800 text-slate-500"
            }`}
          >
            保存してフロップへ
          </Link>

          <button
            type="button"
            onClick={clearActions}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 font-bold text-slate-300"
          >
            プリフロップをクリア
          </button>
        </div>
      </div>
    </main>
  );
}