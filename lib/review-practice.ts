import { type AiReview, type ReviewMode } from "./hand-review-storage";

export type PracticeHand = {
  id: string;
  savedAt?: string;
  heroHand?: { notation?: string; firstCard?: { rank?: string; suit?: string }; secondCard?: { rank?: string; suit?: string } };
  positions?: { heroPosition?: string };
};
export type PracticeEntry = { hand: PracticeHand; review: AiReview; mode: ReviewMode };
export type PracticeFilters = { mode: "all" | ReviewMode; maxScore: number; issue: string; query: string; sort: "scoreLow" | "reviewNewest" };

export function reviewTasks(review: AiReview): string[] {
  return [...new Set([
    review.mainLeak, ...review.improvementPoints, ...review.nextGoals,
    ...Object.values(review.streets).flatMap((street) => street.improvementPoints),
  ].filter((value) => value && value !== "記録なし"))];
}

export function filterPracticeEntries(entries: PracticeEntry[], filters: PracticeFilters): PracticeEntry[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return entries.filter(({ mode, review }) =>
    (filters.mode === "all" || mode === filters.mode) &&
    review.totalScore <= filters.maxScore &&
    (!filters.issue || review.mainLeak === filters.issue) &&
    (!query || reviewTasks(review).join(" ").toLocaleLowerCase().includes(query)),
  ).sort((a, b) => {
    const timeA = Date.parse(a.review.reviewedAt ?? "") || 0;
    const timeB = Date.parse(b.review.reviewedAt ?? "") || 0;
    if (filters.sort === "reviewNewest") return timeB - timeA || a.review.totalScore - b.review.totalScore;
    return a.review.totalScore - b.review.totalScore || timeB - timeA || a.hand.id.localeCompare(b.hand.id);
  });
}
