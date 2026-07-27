import type {
  FinishedTournament,
} from "@/lib/tournament-storage";

export const TOURNAMENT_REVIEW_CACHE_KEY =
  "poker-read-tournament-ai-review-v1";

export type TournamentReviewRequest = {
  tournaments: FinishedTournament[];
};

export type TournamentAiReview = {
  grade: "A" | "B" | "C" | "D";
  score: number;
  headline: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  nextGoals: string[];
  trend: string;
  stackAdvice: string;
  itmAdvice: string;
  finalMessage: string;
  dataNotes: string[];
  generatedAt: string;
  tournamentCount: number;
};

export type TournamentReviewCache = {
  historySignature: string;
  review: TournamentAiReview;
};

export function createTournamentHistorySignature(
  history: FinishedTournament[],
): string {
  return history
    .map(
      (tournament) =>
        `${tournament.id}:${tournament.finishedAt}:${tournament.finalHeroBb}`,
    )
    .join("|");
}

export function readTournamentReviewCache():
  | TournamentReviewCache
  | null {
  try {
    const raw = window.localStorage.getItem(
      TOURNAMENT_REVIEW_CACHE_KEY,
    );

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(
      raw,
    ) as Partial<TournamentReviewCache>;

    if (
      typeof parsed.historySignature !== "string" ||
      !parsed.review ||
      typeof parsed.review !== "object"
    ) {
      return null;
    }

    return parsed as TournamentReviewCache;
  } catch {
    return null;
  }
}

export function saveTournamentReviewCache(
  cache: TournamentReviewCache,
): void {
  window.localStorage.setItem(
    TOURNAMENT_REVIEW_CACHE_KEY,
    JSON.stringify(cache),
  );
}

export function clearTournamentReviewCache(): void {
  window.localStorage.removeItem(
    TOURNAMENT_REVIEW_CACHE_KEY,
  );
}
