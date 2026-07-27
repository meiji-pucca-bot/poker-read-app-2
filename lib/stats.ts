import type {
  FinishedTournament,
} from "@/lib/tournament-storage";

export type TournamentStats = {
  totalTournaments: number;
  estimatedItmCount: number;
  estimatedItmRate: number;
  averageFinalHeroBb: number;
  averageStartingPlayers: number;
  averageBuyIn: number;
  totalBuyIn: number;
  bestFinalHeroBb: number;
  latestFinalHeroBb: number;
};

export type TournamentChartPoint = {
  id: string;
  label: string;
  date: string;
  value: number;
  tournamentName: string;
};

function toNumber(value: string): number {
  const normalized = value
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "")
    .trim();

  const number = Number(normalized);

  return Number.isFinite(number) ? number : 0;
}

function average(values: number[]): number {
  const validValues = values.filter(
    (value) => Number.isFinite(value) && value > 0,
  );

  if (validValues.length === 0) {
    return 0;
  }

  return (
    validValues.reduce((sum, value) => sum + value, 0) /
    validValues.length
  );
}

export function isEstimatedItm(
  tournament: FinishedTournament,
): boolean {
  const remainingPlayers = toNumber(
    tournament.form.remainingPlayers,
  );
  const itmPlayers = toNumber(
    tournament.form.itmPlayers,
  );

  return (
    remainingPlayers > 0 &&
    itmPlayers > 0 &&
    remainingPlayers <= itmPlayers
  );
}

export function calculateTournamentStats(
  history: FinishedTournament[],
): TournamentStats {
  const totalTournaments = history.length;

  const estimatedItmCount = history.filter(
    isEstimatedItm,
  ).length;

  const buyIns = history
    .map((tournament) =>
      toNumber(tournament.form.buyIn),
    )
    .filter((value) => value > 0);

  const totalBuyIn = buyIns.reduce(
    (sum, value) => sum + value,
    0,
  );

  const finalHeroBbs = history
    .map((tournament) => tournament.finalHeroBb)
    .filter(
      (value) => Number.isFinite(value) && value >= 0,
    );

  return {
    totalTournaments,
    estimatedItmCount,
    estimatedItmRate:
      totalTournaments > 0
        ? (estimatedItmCount / totalTournaments) * 100
        : 0,
    averageFinalHeroBb: average(finalHeroBbs),
    averageStartingPlayers: average(
      history.map((tournament) =>
        toNumber(tournament.form.startingPlayers),
      ),
    ),
    averageBuyIn:
      buyIns.length > 0
        ? totalBuyIn / buyIns.length
        : 0,
    totalBuyIn,
    bestFinalHeroBb:
      finalHeroBbs.length > 0
        ? Math.max(...finalHeroBbs)
        : 0,
    latestFinalHeroBb:
      history.length > 0
        ? Math.max(0, history[0].finalHeroBb)
        : 0,
  };
}

export function createHeroBbChartData(
  history: FinishedTournament[],
  limit = 12,
): TournamentChartPoint[] {
  return history
    .slice(0, limit)
    .reverse()
    .map((tournament, index) => ({
      id: tournament.id,
      label: `${index + 1}`,
      date: new Intl.DateTimeFormat("ja-JP", {
        month: "numeric",
        day: "numeric",
      }).format(new Date(tournament.finishedAt)),
      value: Math.max(0, tournament.finalHeroBb),
      tournamentName:
        tournament.form.tournamentName.trim() ||
        "名称未入力の大会",
    }));
}

export function formatStatNumber(
  value: number,
  maximumFractionDigits = 1,
): string {
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits,
  }).format(value);
}

export function formatYen(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}
