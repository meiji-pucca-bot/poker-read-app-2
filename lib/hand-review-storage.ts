/** Shared by cash/tournament history and review pages. Reads never migrate or delete data. */
export type ReviewMode = "cash" | "tournament";
export type StreetKey = "preflop" | "flop" | "turn" | "river";
export type StreetReview = {
  score: number | null;
  verdict: string;
  heroAction: string;
  recommendedAction: string;
  goodPoints: string[];
  improvementPoints: string[];
  detail: string;
};
export type AiReview = {
  reviewedAt?: string;
  totalScore: number;
  grade: string;
  stars: number;
  shortSummary: string;
  strongestStreet: string;
  mainLeak: string;
  goodPoints: string[];
  improvementPoints: string[];
  streets: Record<StreetKey, StreetReview>;
  nextGoals: string[];
  finalMessage: string;
  legacy?: boolean;
};
type ReviewStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const streetKeys: StreetKey[] = ["preflop", "flop", "turn", "river"];
export const REVIEW_UPDATED_EVENT = "poker-read-review-updated";

export function reviewCacheKeys(mode: ReviewMode) {
  const legacy = mode === "tournament"
    ? "poker-read-tournament-ai-review-cache"
    : "poker-read-ai-review-cache";
  return { legacy, current: `${legacy}-v2` };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}
function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
function score(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value))) : null;
}

/** Normalize for display only. Raw saved records and unknown fields remain untouched. */
export function normalizeSavedReview(value: unknown): AiReview | null {
  if (!isRecord(value)) return null;
  const totalScore = score(value.totalScore);
  if (totalScore === null) return null;
  const sourceStreets = isRecord(value.streets) ? value.streets : {};
  const streets = {} as Record<StreetKey, StreetReview>;
  for (const key of streetKeys) {
    const street = isRecord(sourceStreets[key]) ? sourceStreets[key] : {};
    streets[key] = {
      score: score(street.score),
      verdict: text(street.verdict, "この項目は保存されていません"),
      heroAction: text(street.heroAction, "記録なし"),
      recommendedAction: text(street.recommendedAction, "記録なし"),
      goodPoints: list(street.goodPoints),
      improvementPoints: list(street.improvementPoints),
      detail: text(street.detail, "旧形式のレビューには、この項目が含まれていない場合があります。"),
    };
  }
  return {
    reviewedAt: typeof value.reviewedAt === "string" && Number.isFinite(Date.parse(value.reviewedAt)) ? value.reviewedAt : undefined,
    totalScore,
    grade: text(value.grade, totalScore >= 90 ? "S" : totalScore >= 80 ? "A" : totalScore >= 70 ? "B" : totalScore >= 60 ? "C" : "D"),
    stars: typeof value.stars === "number" && Number.isFinite(value.stars)
      ? Math.max(1, Math.min(5, Math.round(value.stars))) : Math.max(1, Math.ceil(totalScore / 20)),
    shortSummary: text(value.shortSummary, text(value.summary)),
    strongestStreet: text(value.strongestStreet, "記録なし"),
    mainLeak: text(value.mainLeak, "記録なし"),
    goodPoints: list(value.goodPoints),
    improvementPoints: list(value.improvementPoints),
    streets,
    nextGoals: list(value.nextGoals),
    finalMessage: text(value.finalMessage),
    legacy: streetKeys.some((key) => !isRecord(sourceStreets[key])),
  };
}

function readRaw(storage: ReviewStorage, key: string): Record<string, unknown> {
  const raw = storage.getItem(key);
  if (raw === null) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) throw new Error("保存データの形式を確認できません。");
  return parsed;
}

export function readReviewCache(mode: ReviewMode, suppliedStorage?: ReviewStorage) {
  const reviews: Record<string, AiReview> = Object.create(null);
  let warning = "";
  const keys = reviewCacheKeys(mode);
  for (const key of [keys.legacy, keys.current]) {
    try {
      const storage = suppliedStorage ?? window.localStorage;
      for (const [id, raw] of Object.entries(readRaw(storage, key))) {
        const review = normalizeSavedReview(raw);
        if (review) reviews[id] = review; // Valid v2 wins; invalid entries never hide a valid legacy review.
      }
    } catch {
      warning = "一部の保存済みレビューを読み込めませんでした。保存データは変更していません。";
    }
  }
  return { reviews, warning };
}

function notifyUpdated() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REVIEW_UPDATED_EVENT));
}

export function saveReview(mode: ReviewMode, handId: string, review: unknown, suppliedStorage?: ReviewStorage) {
  if (!handId || !normalizeSavedReview(review)) throw new Error("レビューの内容またはハンドIDを確認できません。");
  const storage = suppliedStorage ?? window.localStorage;
  const { current } = reviewCacheKeys(mode);
  // Re-read immediately before writing: keep unrelated hands, unknown fields, and legacy data.
  // A malformed map throws rather than silently replacing existing bytes with an empty map.
  const cache = readRaw(storage, current);
  storage.setItem(current, JSON.stringify({ ...cache, [handId]: { ...(review as Record<string, unknown>), reviewedAt: new Date().toISOString() } }));
  notifyUpdated();
}

export function deleteReview(mode: ReviewMode, handId: string, suppliedStorage?: ReviewStorage) {
  const storage = suppliedStorage ?? window.localStorage;
  const keys = reviewCacheKeys(mode);
  // Parse both before any write, and remove legacy first to avoid resurrecting it after v2 deletion.
  const changes = [keys.legacy, keys.current].map((key) => ({ key, cache: readRaw(storage, key) }));
  for (const { key, cache } of changes) {
    if (Object.hasOwn(cache, handId)) {
      delete cache[handId];
      storage.setItem(key, JSON.stringify(cache));
    }
  }
  notifyUpdated();
}

export function clearReviewCache(mode: ReviewMode, suppliedStorage?: ReviewStorage) {
  const storage = suppliedStorage ?? window.localStorage;
  const keys = reviewCacheKeys(mode);
  storage.removeItem(keys.legacy);
  storage.removeItem(keys.current);
  notifyUpdated();
}
