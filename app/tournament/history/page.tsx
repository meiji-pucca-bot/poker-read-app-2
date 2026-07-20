"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ResultFilter = "all" | "win" | "lose" | "chop";
type ReviewFilter = "all" | "reviewed" | "unreviewed";
type FavoriteFilter = "all" | "favorites";
type SortType = "newest" | "oldest" | "scoreHigh" | "importanceHigh";

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
  mode?: "cash" | "tournament";
  tournament?: {
    id?: string;
    tournamentName?: string;
    smallBlind?: number;
    bigBlind?: number;
    ante?: number;
    heroStack?: number;
    heroStackBb?: number;
    remainingPlayers?: number;
    paidPlaces?: number;
    currentRank?: number | null;
    phase?: string;
    considerIcm?: boolean;
  };
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
    villainHand?: {
      firstCard?: Card;
      secondCard?: Card;
      text?: string;
    } | null;
  };
};

type CachedReview = {
  totalScore?: number;
  grade?: string;
  stars?: number;
};

const reviewCacheKey = "poker-read-tournament-ai-review-cache";
const favoriteStorageKey = "poker-read-tournament-favorite-hands";

const resultFilters: { key: ResultFilter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "win", label: "勝ち" },
  { key: "lose", label: "負け" },
  { key: "chop", label: "チョップ" },
];

function safeParseHands(): StoredHand[] {
  const saved = localStorage.getItem("poker-read-tournament-hands");
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseReviewCache(): Record<string, CachedReview> {
  const saved = localStorage.getItem(reviewCacheKey);
  if (!saved) return {};
  try {
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}



function safeParseFavorites(): string[] {
  const saved = localStorage.getItem(favoriteStorageKey);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function cardText(card?: Card | null) {
  if (!card?.rank || !card?.suit) return "?";
  return `${card.rank}${card.suit}`;
}

function boardText(street?: StoredStreet) {
  if (!street?.board?.length) return "";
  return street.board.map(cardText).join(" ");
}

function formatDate(dateText: string) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value?: string | number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value ?? "";
  return number.toLocaleString("ja-JP");
}

function actionJapanese(action?: string) {
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
  return action ? labels[action] ?? action : "不明";
}

function resultStyle(type?: string) {
  if (type === "win") {
    return {
      label: "勝ち",
      chip: "border-emerald-700 bg-emerald-400 text-emerald-950",
      glow: "shadow-emerald-950/50",
    };
  }
  if (type === "lose") {
    return {
      label: "負け",
      chip: "border-red-700 bg-red-500 text-white",
      glow: "shadow-red-950/40",
    };
  }
  return {
    label: "チョップ",
    chip: "border-amber-600 bg-amber-300 text-amber-950",
    glow: "shadow-amber-950/40",
  };
}

function getVillains(hand: StoredHand): Villain[] {
  if (Array.isArray(hand.preflop?.villains) && hand.preflop.villains.length > 0) {
    return hand.preflop.villains;
  }
  if (Array.isArray(hand.positions?.villains)) return hand.positions.villains;
  if (hand.positions?.villainPosition) {
    return [{ position: hand.positions.villainPosition, stack: "" }];
  }
  return [];
}

function getShowdownPlayers(hand: StoredHand): ShowdownPlayer[] {
  if (Array.isArray(hand.result?.showdownPlayers)) {
    return hand.result.showdownPlayers;
  }
  if (hand.result?.villainHand) {
    return [{
      position: hand.positions?.villainPosition ?? "相手",
      handKnown: true,
      firstCard: hand.result.villainHand.firstCard,
      secondCard: hand.result.villainHand.secondCard,
      handText: hand.result.villainHand.text,
    }];
  }
  return [];
}

function heroHandText(hand: StoredHand) {
  return (
    hand.heroHand?.notation ||
    `${cardText(hand.heroHand?.firstCard)} ${cardText(hand.heroHand?.secondCard)}`
  );
}

function actorLabel(action: StoredAction, hand: StoredHand) {
  const heroPosition = hand.positions?.heroPosition;
  if (
    action.role === "hero" ||
    action.actor === "hero" ||
    action.position === heroPosition
  ) {
    return `自分${action.position ? `（${action.position}）` : heroPosition ? `（${heroPosition}）` : ""}`;
  }
  return action.position ? `相手（${action.position}）` : "相手";
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
    <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h4 className="font-black">{title}</h4>
      {!actions?.length ? (
        <p className="mt-2 text-sm text-white/35">アクションなし</p>
      ) : (
        <div className="mt-3 space-y-2">
          {actions.map((action, index) => (
            <div
              key={action.id ?? `${title}-${index}`}
              className="rounded-xl border border-white/5 bg-white/5 p-3"
            >
              <p className="text-sm font-black">
                {index + 1}. {actorLabel(action, hand)}
              </p>
              <p className="mt-1 text-sm text-white/70">
                {actionJapanese(action.action)}
                {action.amount ? ` ${formatNumber(action.amount)}` : ""}
                {typeof action.addedAmount === "number" && action.addedAmount > 0
                  ? `（追加 ${formatNumber(action.addedAmount)}`
                  : ""}
                {typeof action.potPercent === "number" &&
                action.addedAmount &&
                action.addedAmount > 0
                  ? ` / ${Math.round(action.potPercent)}% Pot`
                  : ""}
                {typeof action.addedAmount === "number" && action.addedAmount > 0
                  ? "）"
                  : ""}
              </p>
            </div>
          ))}
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
    <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-xl font-black">{boardText(street) || "未入力"}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-white/40">開始ポット</p>
          <p className="mt-1 font-bold">{formatNumber(street?.startingPot) || "不明"}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-white/40">終了ポット</p>
          <p className="mt-1 font-bold">{formatNumber(street?.endingPot) || "不明"}</p>
        </div>
      </div>
    </section>
  );
}

export default function HistoryPage() {
  const [hands, setHands] = useState<StoredHand[]>([]);
  const [reviewCache, setReviewCache] = useState<Record<string, CachedReview>>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [openHandId, setOpenHandId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [sortType, setSortType] = useState<SortType>("newest");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHands(safeParseHands());
    setReviewCache(safeParseReviewCache());
    setFavoriteIds(safeParseFavorites());
    setLoaded(true);
  }, []);

  const positions = useMemo(
    () =>
      Array.from(
        new Set(
          hands
            .map((hand) => hand.positions?.heroPosition)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [hands],
  );

  const filteredHands = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const matchedHands = hands.filter((hand) => {
      const villains = getVillains(hand);
      const review = reviewCache[hand.id];
      const searchableText = [
        heroHandText(hand),
        hand.positions?.heroPosition,
        hand.table?.venue,
        hand.table?.tableName,
        hand.tournament?.tournamentName,
        hand.tournament?.phase,
        ...villains.map((villain) => villain.position),
        hand.result?.memo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesResult =
        resultFilter === "all" || hand.result?.type === resultFilter;
      const matchesReview =
        reviewFilter === "all" ||
        (reviewFilter === "reviewed" && Boolean(review)) ||
        (reviewFilter === "unreviewed" && !review);
      const matchesPosition =
        positionFilter === "all" ||
        hand.positions?.heroPosition === positionFilter;
      const matchesFavorite =
        favoriteFilter === "all" || favoriteIds.includes(hand.id);

      return (
        matchesSearch &&
        matchesResult &&
        matchesReview &&
        matchesPosition &&
        matchesFavorite
      );
    });

    return [...matchedHands].sort((a, b) => {
      if (sortType === "oldest") {
        return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
      }

      if (sortType === "scoreHigh") {
        const scoreA = reviewCache[a.id]?.totalScore ?? -1;
        const scoreB = reviewCache[b.id]?.totalScore ?? -1;
        return scoreB - scoreA;
      }

      if (sortType === "importanceHigh") {
        const importanceA = a.result?.importance ?? 1;
        const importanceB = b.result?.importance ?? 1;
        if (importanceA !== importanceB) {
          return importanceB - importanceA;
        }
      }

      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });
  }, [
    favoriteFilter,
    favoriteIds,
    hands,
    positionFilter,
    resultFilter,
    reviewCache,
    reviewFilter,
    search,
    sortType,
  ]);

  const totalWins = useMemo(
    () => hands.filter((hand) => hand.result?.type === "win").length,
    [hands],
  );

  const reviewedCount = useMemo(
    () => hands.filter((hand) => Boolean(reviewCache[hand.id])).length,
    [hands, reviewCache],
  );

  const averageScore = useMemo(() => {
    const scores = hands
      .map((hand) => reviewCache[hand.id]?.totalScore)
      .filter((score): score is number => typeof score === "number");

    if (scores.length === 0) return null;

    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    );
  }, [hands, reviewCache]);

  function toggleFavorite(handId: string) {
    const nextFavoriteIds = favoriteIds.includes(handId)
      ? favoriteIds.filter((id) => id !== handId)
      : [...favoriteIds, handId];

    setFavoriteIds(nextFavoriteIds);
    localStorage.setItem(favoriteStorageKey, JSON.stringify(nextFavoriteIds));
  }

  function deleteHand(handId: string) {
    if (!window.confirm("このハンドを削除しますか？")) return;

    const nextHands = hands.filter((hand) => hand.id !== handId);
    setHands(nextHands);
    localStorage.setItem("poker-read-tournament-hands", JSON.stringify(nextHands));

    const nextCache = { ...reviewCache };
    delete nextCache[handId];
    setReviewCache(nextCache);
    localStorage.setItem(reviewCacheKey, JSON.stringify(nextCache));

    const nextFavoriteIds = favoriteIds.filter((id) => id !== handId);
    setFavoriteIds(nextFavoriteIds);
    localStorage.setItem(favoriteStorageKey, JSON.stringify(nextFavoriteIds));

    if (openHandId === handId) setOpenHandId(null);
  }

  function deleteAllHands() {
    if (!window.confirm("保存したハンドをすべて削除しますか？この操作は元に戻せません。")) {
      return;
    }
    localStorage.removeItem("poker-read-tournament-hands");
    localStorage.removeItem(reviewCacheKey);
    localStorage.removeItem(favoriteStorageKey);
    setHands([]);
    setReviewCache({});
    setFavoriteIds([]);
    setOpenHandId(null);
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#120b05] p-6 text-white">読み込み中...</main>
    );
  }

  return (
    <main className="min-h-screen bg-[#120b05] px-4 pb-7 pt-[max(56px,calc(env(safe-area-inset-top)+20px))] text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link href="/tournament" className="relative z-20 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-bold text-amber-300 active:bg-white/10">
            ← トーナメントへ戻る
          </Link>

          <p className="mt-6 text-xs font-black tracking-[0.2em] text-sky-300">
            🏆 TOURNAMENT HISTORY
          </p>

          <h1 className="mt-2 text-3xl font-black">トーナメント履歴</h1>

          <p className="mt-2 text-sm leading-7 text-white/55">
            大会名・ポジション・ハンドで検索し、トーナメント専用履歴を復習できます。
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/40">保存ハンド</p>
            <p className="mt-1 text-2xl font-black">{hands.length}</p>
          </div>

          <div className="rounded-3xl border border-emerald-900 bg-emerald-950/30 p-4">
            <p className="text-xs text-amber-300">勝ち</p>
            <p className="mt-1 text-2xl font-black text-amber-300">{totalWins}</p>
          </div>

          <div className="rounded-3xl border border-amber-900 bg-amber-950/30 p-4">
            <p className="text-xs text-amber-300">レビュー済</p>
            <p className="mt-1 text-2xl font-black text-amber-300">{reviewedCount}</p>
          </div>

          <div className="rounded-3xl border border-sky-900 bg-sky-950/30 p-4">
            <p className="text-xs text-sky-300">AI平均点</p>
            <p className="mt-1 text-2xl font-black text-sky-300">
              {averageScore ?? "—"}
            </p>
          </div>
        </section>

        <Link
          href="/tournament/new-hand"
          className="mt-4 flex items-center justify-between rounded-3xl bg-gradient-to-r from-emerald-400 to-lime-300 p-5 font-black text-slate-950 shadow-lg shadow-emerald-950/50"
        >
          <span>🏆 新しいトーナメントハンド</span>
          <span className="text-2xl">›</span>
        </Link>

        {hands.length > 0 && (
          <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
            <label htmlFor="history-search" className="font-black">
              ハンドを検索
            </label>

            <input
              id="history-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="例：AKs、BTN、CO、店舗名"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-4 outline-none focus:border-emerald-400"
            />

            <p className="mt-5 text-xs font-black text-white/45">勝敗</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {resultFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setResultFilter(filter.key)}
                  className={`rounded-xl border px-2 py-3 text-sm font-bold ${
                    resultFilter === filter.key
                      ? "border-emerald-400 bg-emerald-400 text-slate-950"
                      : "border-white/10 bg-black/20 text-white/65"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="position-filter" className="text-xs font-black text-white/45">
                  ポジション
                </label>
                <select
                  id="position-filter"
                  value={positionFilter}
                  onChange={(event) => setPositionFilter(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3"
                >
                  <option value="all">すべて</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="review-filter" className="text-xs font-black text-white/45">
                  AIレビュー
                </label>
                <select
                  id="review-filter"
                  value={reviewFilter}
                  onChange={(event) => setReviewFilter(event.target.value as ReviewFilter)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3"
                >
                  <option value="all">すべて</option>
                  <option value="reviewed">レビュー済み</option>
                  <option value="unreviewed">未レビュー</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() =>
                  setFavoriteFilter(
                    favoriteFilter === "favorites" ? "all" : "favorites",
                  )
                }
                className={`w-full rounded-xl border p-3 text-left font-black ${
                  favoriteFilter === "favorites"
                    ? "border-amber-500 bg-amber-300 text-amber-950"
                    : "border-white/10 bg-black/30 text-white/70"
                }`}
              >
                ⭐ お気に入りだけ表示
              </button>
            </div>

            <div className="mt-4">
              <label htmlFor="sort-type" className="text-xs font-black text-white/45">
                並び順
              </label>
              <select
                id="sort-type"
                value={sortType}
                onChange={(event) => setSortType(event.target.value as SortType)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3"
              >
                <option value="newest">新しい順</option>
                <option value="oldest">古い順</option>
                <option value="scoreHigh">AI評価が高い順</option>
                <option value="importanceHigh">重要度が高い順</option>
              </select>
            </div>

            <p className="mt-4 text-sm text-white/45">
              {filteredHands.length}件を表示
            </p>
          </section>
        )}

        {hands.length === 0 ? (
          <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-7 text-center">
            <p className="text-lg font-black">保存したハンドはありません</p>
            <p className="mt-2 text-sm leading-6 text-white/45">
              ハンドを記録すると、ここに表示されます。
            </p>
          </section>
        ) : filteredHands.length === 0 ? (
          <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-7 text-center">
            <p className="font-black">条件に合うハンドがありません</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setResultFilter("all");
                setReviewFilter("all");
                setFavoriteFilter("all");
                setPositionFilter("all");
                setSortType("newest");
              }}
              className="mt-4 rounded-xl border border-emerald-700 px-4 py-3 font-bold text-emerald-300"
            >
              絞り込みをクリア
            </button>
          </section>
        ) : (
          <div className="mt-5 space-y-4">
            {filteredHands.map((hand) => {
              const style = resultStyle(hand.result?.type);
              const isOpen = openHandId === hand.id;
              const importance = hand.result?.importance ?? 1;
              const villains = getVillains(hand);
              const showdownPlayers = getShowdownPlayers(hand);
              const cachedReview = reviewCache[hand.id];
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
                  className={`overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#10271c] to-[#08130e] shadow-xl ${style.glow}`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenHandId(isOpen ? null : hand.id)}
                    className="w-full p-5 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">♠</span>
                          <h2 className="text-3xl font-black">{heroHandText(hand)}</h2>
                        </div>

                        <p className="mt-2 font-black text-emerald-300">
                          {hand.positions?.heroPosition ?? "位置不明"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={
                            favoriteIds.includes(hand.id)
                              ? "お気に入りから外す"
                              : "お気に入りに追加"
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleFavorite(hand.id);
                          }}
                          className={`flex h-10 w-10 items-center justify-center rounded-full border text-xl ${
                            favoriteIds.includes(hand.id)
                              ? "border-amber-500 bg-amber-300 text-amber-950"
                              : "border-white/10 bg-black/20 text-white/35"
                          }`}
                        >
                          {favoriteIds.includes(hand.id) ? "★" : "☆"}
                        </button>

                        <span className={`rounded-full border px-3 py-1 text-sm font-black ${style.chip}`}>
                          {style.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white/65">
                        相手 {villains.length}人
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white/65">
                        {"★".repeat(importance)}
                        {"☆".repeat(Math.max(0, 5 - importance))}
                      </span>

                      {cachedReview ? (
                        <span className="rounded-full border border-amber-700 bg-amber-300 px-3 py-1 text-xs font-black text-amber-950">
                          🤖 {cachedReview.totalScore ?? "-"}点 {cachedReview.grade ?? ""}
                        </span>
                      ) : (
                        <span className="rounded-full border border-sky-800 bg-sky-950/40 px-3 py-1 text-xs font-black text-sky-300">
                          AI未レビュー
                        </span>
                      )}
                    </div>

                    {fullBoard && (
                      <div className="mt-4 rounded-2xl border border-white/5 bg-black/25 p-3">
                        <p className="text-xs text-white/35">ボード</p>
                        <p className="mt-1 text-lg font-black">{fullBoard}</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-white/35">{formatDate(hand.savedAt)}</p>
                      <p className="text-sm font-black text-emerald-300">
                        {isOpen ? "詳細を閉じる ▲" : "詳細を見る ▼"}
                      </p>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-4 border-t border-white/10 p-5">
                      <section className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-emerald-900 bg-emerald-950/30 p-4">
                          <p className="text-xs text-emerald-300">自分のハンド</p>
                          <p className="mt-2 text-xl font-black">{heroHandText(hand)}</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs text-white/40">スタック</p>
                          <p className="mt-2 text-xl font-black">
                            {formatNumber(hand.table?.heroStack) || "不明"}
                          </p>
                        </div>
                      </section>

                      <section className="rounded-2xl border border-sky-900 bg-sky-950/20 p-4">
                        <h3 className="font-black text-sky-300">対戦相手</h3>
                        {villains.length === 0 ? (
                          <p className="mt-2 text-sm text-white/35">相手情報なし</p>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {villains.map((villain, index) => (
                              <div
                                key={villain.id ?? `${villain.position}-${index}`}
                                className="rounded-xl bg-black/20 p-3"
                              >
                                <p className="font-black text-sky-300">
                                  {villain.position ?? "不明"}
                                </p>
                                <p className="mt-1 text-sm text-white/65">
                                  スタック：{formatNumber(villain.stack) || "不明"}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      <ActionList title="プリフロップ" actions={hand.preflop?.actions} hand={hand} />
                      <StreetSummary title="フロップ" street={hand.flop} />
                      <ActionList title="フロップのアクション" actions={hand.flop?.actions} hand={hand} />
                      <StreetSummary title="ターン" street={hand.turn} />
                      <ActionList title="ターンのアクション" actions={hand.turn?.actions} hand={hand} />
                      <StreetSummary title="リバー" street={hand.river} />
                      <ActionList title="リバーのアクション" actions={hand.river?.actions} hand={hand} />

                      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <h3 className="font-black">ショーダウン</h3>
                        <p className="mt-2 text-sm">
                          {hand.result?.showdown === "yes" ? "あり" : "なし"}
                        </p>

                        {hand.result?.showdown === "yes" && (
                          <div className="mt-3 space-y-2">
                            {showdownPlayers.length > 0 ? (
                              showdownPlayers.map((player, index) => (
                                <div
                                  key={player.id ?? `${player.position}-${index}`}
                                  className="rounded-xl border border-sky-900 bg-sky-950/20 p-3"
                                >
                                  <p className="font-black text-sky-300">
                                    {player.position ?? "相手"}
                                  </p>
                                  <p className="mt-1 text-sm text-white/65">
                                    ハンド：
                                    {player.handKnown
                                      ? player.handText ||
                                        `${cardText(player.firstCard)} ${cardText(player.secondCard)}`
                                      : "不明"}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-white/35">相手ハンド不明</p>
                            )}
                          </div>
                        )}
                      </section>

                      {hand.result?.memo && (
                        <section className="rounded-2xl border border-amber-900 bg-amber-950/20 p-4">
                          <h3 className="font-black text-amber-300">メモ</h3>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/70">
                            {hand.result.memo}
                          </p>
                        </section>
                      )}

                      <Link
                        href={`/tournament/review?handId=${encodeURIComponent(hand.id)}`}
                        className={`block w-full rounded-2xl p-4 text-center font-black ${
                          cachedReview
                            ? "border border-amber-700 bg-amber-300 text-amber-950"
                            : "bg-gradient-to-r from-emerald-400 to-lime-300 text-slate-950"
                        }`}
                      >
                        {cachedReview
                          ? `🤖 AIレビューを見る（${cachedReview.totalScore ?? "-"}点）`
                          : "🤖 このハンドをAIレビュー"}
                      </Link>

                      <button
                        type="button"
                        onClick={() => deleteHand(hand.id)}
                        className="w-full rounded-2xl border border-red-900 bg-red-950/20 p-4 font-bold text-red-300"
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
            className="mt-8 w-full rounded-2xl border border-red-950 p-4 text-sm font-bold text-red-400"
          >
            保存したハンドをすべて削除
          </button>
        )}
      </div>

      
    </main>
  );
}
