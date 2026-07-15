"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const tablePositions = [
  "UTG",
  "UTG+1",
  "MP",
  "LJ",
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
  | "5BET"
  | "All-in";

type PreflopAction = {
  id: string;
  position: Position;
  action: ActionType;
  amount: string;
  addedAmount: number;
  potBefore: number;
};

type Villain = {
  id: string;
  position: Position;
  stack: string;
};

type SavedPositions = {
  heroPosition?: Position;
};

type SavedTable = {
  smallBlind?: string;
  bigBlind?: string;
  heroStack?: string;
};

type ContributionMap = Record<Position, number>;

type PreflopDraft = {
  actions?: PreflopAction[];
  villains?: Villain[];
  activePosition?: Position;
};

const actionOptions: {
  key: ActionType;
  label: string;
  description: string;
  needsAmount: boolean;
}[] = [
  {
    key: "Fold",
    label: "フォールド",
    description: "ハンドを降りる",
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
    description: "オープンへの再レイズ",
    needsAmount: true,
  },
  {
    key: "4BET",
    label: "4ベット",
    description: "3ベットへの再レイズ",
    needsAmount: true,
  },
  {
    key: "5BET",
    label: "5ベット",
    description: "4ベットへの再レイズ",
    needsAmount: true,
  },
  {
    key: "All-in",
    label: "オールイン",
    description: "残りスタックをすべて自動投入",
    needsAmount: false,
  },
];

function formatNumber(value: string | number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString("ja-JP");
}

function amountToBb(
  amount: string | number,
  bigBlind: string,
) {
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

function createInitialContributions(
  smallBlind: string,
  bigBlind: string,
): ContributionMap {
  return {
    UTG: 0,
    "UTG+1": 0,
    MP: 0,
    LJ: 0,
    HJ: 0,
    CO: 0,
    BTN: 0,
    SB: Number(smallBlind) || 0,
    BB: Number(bigBlind) || 0,
  };
}

function calculatePreflopState(
  actions: PreflopAction[],
  smallBlind: string,
  bigBlind: string,
) {
  const contributions = createInitialContributions(
    smallBlind,
    bigBlind,
  );

  let highestContribution = Math.max(
    ...Object.values(contributions),
  );

  actions.forEach((action) => {
    if (
      action.action === "Fold" ||
      action.action === "Check"
    ) {
      return;
    }

    contributions[action.position] +=
      Number(action.addedAmount) || 0;

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
  const router = useRouter();

  const [heroPosition, setHeroPosition] =
    useState<Position | "">("");

  const [smallBlind, setSmallBlind] = useState("");
  const [bigBlind, setBigBlind] = useState("");
  const [heroStack, setHeroStack] = useState("");

  const [villains, setVillains] =
    useState<Villain[]>([]);

  const [actions, setActions] =
    useState<PreflopAction[]>([]);

  const [activePosition, setActivePosition] =
    useState<Position>("UTG");

  const [selectedAction, setSelectedAction] =
    useState<ActionType | "">("");

  const [amount, setAmount] = useState("");

  const [villainStackInput, setVillainStackInput] =
    useState("");

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

        setHeroPosition(parsed.heroPosition ?? "");
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
        setHeroStack(parsed.heroStack ?? "");
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
        const parsed = JSON.parse(
          savedDraft,
        ) as PreflopDraft;

        setActions(
          Array.isArray(parsed.actions)
            ? parsed.actions
            : [],
        );

        setVillains(
          Array.isArray(parsed.villains)
            ? parsed.villains
            : [],
        );

        if (
          parsed.activePosition &&
          tablePositions.includes(
            parsed.activePosition,
          )
        ) {
          setActivePosition(parsed.activePosition);
        }
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
      JSON.stringify({
        actions,
        villains,
        activePosition,
      }),
    );
  }, [actions, villains, activePosition, loaded]);

  const preflopState = useMemo(
    () =>
      calculatePreflopState(
        actions,
        smallBlind,
        bigBlind,
      ),
    [actions, smallBlind, bigBlind],
  );

  const selectedOption = actionOptions.find(
    (option) => option.key === selectedAction,
  );

  const activeContribution =
    preflopState.contributions[activePosition];

  const automaticCallAmount = Math.max(
    0,
    preflopState.highestContribution -
      activeContribution,
  );

  const activeVillain = villains.find(
    (villain) =>
      villain.position === activePosition,
  );

  const activeStartingStack =
    activePosition === heroPosition
      ? Number(heroStack) || 0
      : Number(activeVillain?.stack) || 0;

  const activeRemainingStack = Math.max(
    0,
    activeStartingStack - activeContribution,
  );

  const previewAddedAmount = useMemo(() => {
    if (selectedAction === "Limp") {
      return Math.min(
        activeRemainingStack,
        Math.max(
          0,
          Number(bigBlind) - activeContribution,
        ),
      );
    }

    if (selectedAction === "Call") {
      return Math.min(
        activeRemainingStack,
        automaticCallAmount,
      );
    }

    if (selectedAction === "All-in") {
      return activeRemainingStack;
    }

    if (selectedOption?.needsAmount) {
      return Math.max(
        0,
        Number(amount) - activeContribution,
      );
    }

    return 0;
  }, [
    selectedAction,
    selectedOption,
    bigBlind,
    activeContribution,
    automaticCallAmount,
    activeRemainingStack,
    amount,
  ]);

  const enteredBb = amountToBb(amount, bigBlind);

  useEffect(() => {
    setVillainStackInput(
      activeVillain?.stack ?? "",
    );
  }, [activePosition, activeVillain?.stack]);

  function isVillain(position: Position) {
    return villains.some(
      (villain) => villain.position === position,
    );
  }

  function actorLabel(position: Position) {
    if (position === heroPosition) {
      return `${position}（自分）`;
    }

    if (isVillain(position)) {
      return `${position}（相手）`;
    }

    return position;
  }

  function selectPosition(position: Position) {
    setActivePosition(position);

    const selectedVillain = villains.find(
      (villain) =>
        villain.position === position,
    );

    setVillainStackInput(
      selectedVillain?.stack ?? "",
    );

    setSelectedAction("");
    setAmount("");
    setMessage("");
  }

  function registerVillain() {
    if (activePosition === heroPosition) {
      setMessage(
        "自分のポジションは相手として登録できません。",
      );
      return;
    }

    const stackNumber = Number(villainStackInput);

    if (
      !villainStackInput ||
      !Number.isFinite(stackNumber) ||
      stackNumber <= 0
    ) {
      setMessage(
        "相手のおおよそのスタックを入力してください。",
      );
      return;
    }

    setVillains((current) => {
      const existing = current.find(
        (villain) =>
          villain.position === activePosition,
      );

      if (existing) {
        return current.map((villain) =>
          villain.position === activePosition
            ? {
                ...villain,
                stack: villainStackInput,
              }
            : villain,
        );
      }

      return [
        ...current,
        {
          id: crypto.randomUUID(),
          position: activePosition,
          stack: villainStackInput,
        },
      ];
    });

    setMessage(
      `${activePosition}を相手として登録しました。`,
    );
  }

  function removeVillain(position: Position) {
    setVillains((current) =>
      current.filter(
        (villain) =>
          villain.position !== position,
      ),
    );

    setVillainStackInput("");
    setMessage(
      `${position}の相手登録を解除しました。`,
    );
  }


  function getPreflopFlowState(
    targetActions: PreflopAction[],
    targetVillains: Villain[],
  ) {
    const foldedPositions = new Set(
      targetActions
        .filter((action) => action.action === "Fold")
        .map((action) => action.position),
    );

    const allInPositions = new Set(
      targetActions
        .filter((action) => action.action === "All-in")
        .map((action) => action.position),
    );

    const participantPositions = Array.from(
      new Set(
        [
          heroPosition || null,
          ...targetVillains.map((villain) => villain.position),
        ].filter((position): position is Position =>
          Boolean(position),
        ),
      ),
    );

    const nonFoldedPositions = participantPositions.filter(
      (position) => !foldedPositions.has(position),
    );

    const actionablePositions = nonFoldedPositions.filter(
      (position) => !allInPositions.has(position),
    );

    const state = calculatePreflopState(
      targetActions,
      smallBlind,
      bigBlind,
    );

    const heroFolded = Boolean(
      heroPosition &&
        foldedPositions.has(heroPosition),
    );

    const allInExists = allInPositions.size > 0;

    const bettingClosedByAllIn =
      !heroFolded &&
      nonFoldedPositions.length >= 2 &&
      allInExists &&
      (
        actionablePositions.length === 0 ||
        (
          actionablePositions.length === 1 &&
          state.contributions[
            actionablePositions[0]
          ] >= state.highestContribution
        )
      );

    return {
      foldedPositions,
      allInPositions,
      participantPositions,
      nonFoldedPositions,
      actionablePositions,
      heroFolded,
      bettingClosedByAllIn,
      bettingClosed:
        heroFolded || bettingClosedByAllIn,
    };
  }

  const currentFlowState = useMemo(
    () =>
      getPreflopFlowState(
        actions,
        villains,
      ),
    [
      actions,
      villains,
      heroPosition,
      smallBlind,
      bigBlind,
    ],
  );

  function moveToNextEligiblePosition(
    currentPosition: Position,
    targetActions: PreflopAction[],
    targetVillains: Villain[],
  ) {
    const flowState = getPreflopFlowState(
      targetActions,
      targetVillains,
    );

    if (flowState.bettingClosed) {
      return;
    }

    const currentIndex =
      tablePositions.indexOf(currentPosition);

    for (
      let offset = 1;
      offset <= tablePositions.length;
      offset += 1
    ) {
      const nextIndex =
        (currentIndex + offset) %
        tablePositions.length;

      const nextPosition =
        tablePositions[nextIndex];

      if (
        flowState.foldedPositions.has(nextPosition) ||
        flowState.allInPositions.has(nextPosition)
      ) {
        continue;
      }

      selectPosition(nextPosition);
      return;
    }
  }

  function addAction() {
    if (currentFlowState.bettingClosed) {
      setMessage(
        currentFlowState.heroFolded
          ? "自分はフォールド済みです。保存して次へ進んでください。"
          : "ベッティングは終了しています。保存して次へ進んでください。",
      );
      return;
    }

    if (!selectedAction) {
      setMessage(
        "アクションを選んでください。",
      );
      return;
    }

    let nextVillains = villains;

    // 自分以外がフォールド以外の行動をした場合、
    // 入力されたスタックで相手情報を自動登録・更新します。
    if (
      activePosition !== heroPosition &&
      selectedAction !== "Fold"
    ) {
      const stackNumber = Number(villainStackInput);

      if (
        !villainStackInput ||
        !Number.isFinite(stackNumber) ||
        stackNumber <= 0
      ) {
        setMessage(
          `${activePosition}のスタックを入力してください。入力後、そのままアクションを追加すると相手として自動登録されます。`,
        );
        return;
      }

      const existing = villains.find(
        (villain) =>
          villain.position === activePosition,
      );

      nextVillains = existing
        ? villains.map((villain) =>
            villain.position === activePosition
              ? {
                  ...villain,
                  stack: villainStackInput,
                }
              : villain,
          )
        : [
            ...villains,
            {
              id: crypto.randomUUID(),
              position: activePosition,
              stack: villainStackInput,
            },
          ];
    }

    if (
      selectedOption?.needsAmount &&
      !amount
    ) {
      setMessage(
        "最終的な投入額を入力してください。",
      );
      return;
    }

    const effectiveStartingStack =
      activePosition === heroPosition
        ? Number(heroStack) || 0
        : Number(
            nextVillains.find(
              (villain) =>
                villain.position === activePosition,
            )?.stack,
          ) || 0;

    const effectiveRemainingStack = Math.max(
      0,
      effectiveStartingStack - activeContribution,
    );

    if (
      selectedAction === "All-in" &&
      effectiveStartingStack <= 0
    ) {
      setMessage(
        activePosition === heroPosition
          ? "自分のスタックを確認してください。"
          : "先にこの相手のスタックを登録してください。",
      );
      return;
    }

    if (
      selectedAction === "All-in" &&
      effectiveRemainingStack <= 0
    ) {
      setMessage(
        "残りスタックがありません。",
      );
      return;
    }

    if (
      selectedAction === "Check" &&
      activeContribution <
        preflopState.highestContribution
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
      selectedAction === "Limp" &&
      preflopState.highestContribution >
        Number(bigBlind)
    ) {
      setMessage(
        "すでにレイズがあるため、コールを選んでください。",
      );
      return;
    }

    if (selectedOption?.needsAmount) {
      const finalAmount = Number(amount);

      if (
        !Number.isFinite(finalAmount) ||
        finalAmount <= activeContribution
      ) {
        setMessage(
          "現在の投入額より大きい金額を入力してください。",
        );
        return;
      }

      if (
        effectiveStartingStack > 0 &&
        finalAmount > effectiveStartingStack
      ) {
        setMessage(
          "スタックを超える金額は入力できません。",
        );
        return;
      }

      if (
        finalAmount <=
        preflopState.highestContribution
      ) {
        setMessage(
          "レイズ額は現在の最高額より大きくしてください。",
        );
        return;
      }
    }

    let finalAmount = activeContribution;

    if (selectedAction === "Limp") {
      finalAmount = Math.min(
        Number(bigBlind) || 0,
        effectiveStartingStack ||
          Number(bigBlind) ||
          0,
      );
    } else if (selectedAction === "Call") {
      finalAmount =
        activeContribution +
        Math.min(
          automaticCallAmount,
          effectiveRemainingStack ||
            automaticCallAmount,
        );
    } else if (selectedAction === "All-in") {
      finalAmount = effectiveStartingStack;
    } else if (selectedOption?.needsAmount) {
      finalAmount = Number(amount);
    }

    const addedAmount = Math.max(
      0,
      finalAmount - activeContribution,
    );

    const newAction: PreflopAction = {
      id: crypto.randomUUID(),
      position: activePosition,
      action: selectedAction,
      amount:
        selectedAction === "Fold" ||
        selectedAction === "Check"
          ? ""
          : String(finalAmount),
      addedAmount,
      potBefore: preflopState.pot,
    };

    const nextActions = [
      ...actions,
      newAction,
    ];

    setVillains(nextVillains);
    setActions(nextActions);
    setSelectedAction("");
    setAmount("");

    const nextFlowState = getPreflopFlowState(
      nextActions,
      nextVillains,
    );

    if (nextFlowState.heroFolded) {
      setMessage(
        "自分がフォールドしました。以降のアクション入力は不要です。保存して次へ進んでください。",
      );
      return;
    }

    if (nextFlowState.bettingClosedByAllIn) {
      setMessage(
        "オールインでベッティングが終了しました。保存後は残りのボードカードだけ入力します。",
      );
      return;
    }

    setMessage("");

    moveToNextEligiblePosition(
      activePosition,
      nextActions,
      nextVillains,
    );
  }

  function foldUntilHero() {
    if (!heroPosition) {
      setMessage(
        "自分のポジションが読み込まれていません。",
      );
      return;
    }

    const heroIndex =
      tablePositions.indexOf(heroPosition);

    const actedPositions = new Set(
      actions.map(
        (action) => action.position,
      ),
    );

    const folds: PreflopAction[] =
      tablePositions
        .slice(0, heroIndex)
        .filter(
          (position) =>
            !actedPositions.has(position),
        )
        .map((position) => ({
          id: crypto.randomUUID(),
          position,
          action: "Fold",
          amount: "",
          addedAmount: 0,
          potBefore: preflopState.pot,
        }));

    setActions((current) => [
      ...current,
      ...folds,
    ]);

    selectPosition(heroPosition);
  }

  function undoLastAction() {
    const lastAction = actions.at(-1);

    if (lastAction) {
      selectPosition(lastAction.position);
    }

    setActions((current) =>
      current.slice(0, -1),
    );

    setMessage("");
  }

  function clearActions() {
    setActions([]);
    setVillains([]);
    setActivePosition("UTG");
    setSelectedAction("");
    setAmount("");
    setVillainStackInput("");

    localStorage.removeItem(
      "poker-read-preflop-draft",
    );

    localStorage.removeItem(
      "poker-read-preflop",
    );

    setMessage(
      "プリフロップ入力をクリアしました。",
    );
  }

  function savePreflop() {
    if (actions.length === 0) {
      setMessage(
        "プリフロップのアクションを入力してください。",
      );
      return;
    }

    const opponentPositions = Array.from(
      new Set(
        actions
          .filter(
            (action) =>
              action.position !== heroPosition &&
              action.action !== "Fold",
          )
          .map((action) => action.position),
      ),
    );

    if (opponentPositions.length === 0) {
      setMessage(
        "対戦した相手のアクションを入力してください。",
      );
      return;
    }

    const participatingVillains = villains.filter(
      (villain) =>
        opponentPositions.includes(villain.position),
    );

    const missingVillainPositions =
      opponentPositions.filter(
        (position) =>
          !participatingVillains.some(
            (villain) =>
              villain.position === position &&
              Number(villain.stack) > 0,
          ),
      );

    if (missingVillainPositions.length > 0) {
      setMessage(
        `${missingVillainPositions.join(
          "、",
        )}のスタックを入力して、該当するアクションをもう一度追加してください。`,
      );
      return;
    }

    localStorage.setItem(
      "poker-read-preflop",
      JSON.stringify({
        actions,
        endingPot: preflopState.pot,
        contributions:
          preflopState.contributions,
        heroPosition,
        villains: participatingVillains,
        heroFolded: currentFlowState.heroFolded,
        bettingClosedByAllIn:
          currentFlowState.bettingClosedByAllIn,
        bettingClosed:
          currentFlowState.bettingClosed,
        savedAt: new Date().toISOString(),
      }),
    );

    localStorage.setItem(
      "poker-read-positions",
      JSON.stringify({
        heroPosition,
        villainPosition:
          participatingVillains[0]?.position ?? "",
        villains: participatingVillains,
        savedAt: new Date().toISOString(),
      }),
    );

    localStorage.removeItem(
      "poker-read-preflop-draft",
    );

    router.push("/flop");
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
            各ポジションの行動を順番に入力します。
            実際に対戦した相手だけ、ポジションとスタックを登録してください。
          </p>
        </header>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-1/2 rounded-full bg-emerald-500" />
        </div>

        <section className="mb-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            自分のポジション
          </p>

          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {heroPosition || "未選択"}
          </p>

          <p className="mt-2 text-sm text-slate-300">
            自分のスタック：
            {heroStack
              ? formatNumber(heroStack)
              : "未入力"}

            {amountToBb(
              heroStack,
              bigBlind,
            ) !== null &&
              `（${Number(
                amountToBb(
                  heroStack,
                  bigBlind,
                )!.toFixed(2),
              )}bb）`}
          </p>
        </section>

        <section className="mb-4 rounded-2xl border border-emerald-900 bg-emerald-950/40 p-5">
          <p className="text-sm text-emerald-300">
            現在のポット
          </p>

          <p className="mt-1 text-3xl font-bold">
            {formatNumber(preflopState.pot)}
          </p>

          <p className="mt-2 text-sm text-slate-300">
            {amountToBb(
              preflopState.pot,
              bigBlind,
            ) !== null
              ? `${Number(
                  amountToBb(
                    preflopState.pot,
                    bigBlind,
                  )!.toFixed(2),
                )}bb`
              : "BB換算できません"}
          </p>
        </section>

        {currentFlowState.bettingClosed && (
          <section className="mb-4 rounded-2xl border border-amber-700 bg-amber-950/40 p-5">
            <p className="text-sm font-bold text-amber-300">
              {currentFlowState.heroFolded
                ? "♠ 自分はフォールド済みです"
                : "♠ オールイン状態"}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-200">
              {currentFlowState.heroFolded
                ? "以降のアクション入力は不要です。保存して次へ進んでください。"
                : "ベッティングは終了しています。保存後は残りのボードカードだけ入力します。"}
            </p>
          </section>
        )}

        <button
          type="button"
          onClick={foldUntilHero}
          disabled={currentFlowState.bettingClosed}
          className="mb-4 w-full rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 font-bold text-emerald-300 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-600"
        >
          自分の手前まで未入力者をフォールド
        </button>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-bold">
            行動したポジション
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {tablePositions.map((position) => {
              const selected =
                activePosition === position;

              const hero =
                position === heroPosition;

              const villain =
                isVillain(position);

              return (
                <button
                  key={position}
                  type="button"
                  disabled={
                    currentFlowState.bettingClosed ||
                    currentFlowState.foldedPositions.has(position) ||
                    currentFlowState.allInPositions.has(position)
                  }
                  onClick={() =>
                    selectPosition(position)
                  }
                  className={`rounded-xl border py-3 font-bold ${
                    selected
                      ? hero
                        ? "border-emerald-500 bg-emerald-500 text-slate-950"
                        : villain
                          ? "border-sky-400 bg-sky-500 text-slate-950"
                          : "border-white bg-white text-slate-950"
                      : hero
                        ? "border-emerald-800 bg-emerald-950/30 text-emerald-300"
                        : villain
                          ? "border-sky-900 bg-sky-950/30 text-sky-300"
                          : "border-slate-700 bg-slate-950"
                  } disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-950 disabled:text-slate-600`}
                >
                  {position}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-slate-950 p-4">
            <p className="text-sm text-slate-400">
              入力中
            </p>

            <p className="mt-1 text-xl font-bold">
              {actorLabel(activePosition)}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              現在の投入額：
              {formatNumber(activeContribution)}
            </p>

            {activeStartingStack > 0 && (
              <p className="mt-1 text-sm text-amber-300">
                残りスタック：
                {formatNumber(activeRemainingStack)}
              </p>
            )}
          </div>

          {!currentFlowState.bettingClosed &&
            activePosition !== heroPosition && (
            <div className="mt-4 rounded-2xl border border-sky-900 bg-sky-950/30 p-4">
              <p className="text-sm font-bold text-sky-300">
                対戦相手として登録
              </p>

              <label
                htmlFor="villain-stack"
                className="mt-4 block font-bold"
              >
                {activePosition}のスタック
              </label>

              <input
                id="villain-stack"
                inputMode="numeric"
                value={villainStackInput}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  if (
                    value === "" ||
                    /^\d*$/.test(value)
                  ) {
                    setVillainStackInput(value);
                  }
                }}
                placeholder="例：65000"
                className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-xl font-bold outline-none focus:border-sky-400"
              />

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={registerVillain}
                  className="rounded-xl bg-sky-500 p-3 font-bold text-slate-950"
                >
                  {activeVillain
                    ? "スタックを更新"
                    : "相手として登録"}
                </button>

                {activeVillain && (
                  <button
                    type="button"
                    onClick={() =>
                      removeVillain(activePosition)
                    }
                    className="rounded-xl border border-red-900 p-3 font-bold text-red-300"
                  >
                    登録を解除
                  </button>
                )}
              </div>
            </div>
          )}

          <h2 className="mt-6 text-lg font-bold">
            アクション
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {actionOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                disabled={currentFlowState.bettingClosed}
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
                } disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-950 disabled:text-slate-600`}
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
                最終投入額：
                {formatNumber(activeStartingStack)}
              </p>
            </div>
          )}

          {(selectedAction === "Call" ||
            selectedAction === "Limp") && (
            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">
                今回の追加額
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-400">
                {formatNumber(previewAddedAmount)}
              </p>
            </div>
          )}

          {selectedOption?.needsAmount && (
            <div className="mt-5">
              <label
                htmlFor="preflop-amount"
                className="block font-bold"
              >
                最終的な投入額
              </label>

              <input
                id="preflop-amount"
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
                placeholder="例：2500"
                className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-2xl font-bold outline-none focus:border-emerald-500"
              />

              {amount && (
                <div className="mt-3 rounded-xl border border-emerald-900 bg-emerald-950/30 p-4">
                  <p className="font-bold text-emerald-300">
                    最終額：
                    {formatNumber(amount)}

                    {enteredBb !== null &&
                      `（${Number(
                        enteredBb.toFixed(2),
                      )}bb）`}
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    今回の追加額：
                    {formatNumber(previewAddedAmount)}
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={addAction}
            disabled={currentFlowState.bettingClosed}
            className="mt-5 w-full rounded-xl bg-emerald-500 p-4 font-bold text-slate-950 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {currentFlowState.bettingClosed
              ? "アクション入力は終了しています"
              : "このアクションを追加"}
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
              {actions.map((action, index) => (
                <div
                  key={action.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <p className="font-bold">
                    {index + 1}.{" "}
                    {actorLabel(action.position)}
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
          )}
        </section>

        {message && (
          <p className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={savePreflop}
            className="w-full rounded-2xl bg-emerald-500 p-5 text-lg font-bold text-slate-950 active:scale-95"
          >
            保存してフロップへ
          </button>

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