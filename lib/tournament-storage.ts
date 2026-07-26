export const TOURNAMENT_STORAGE_KEY =
  "poker-read-active-tournament";

export const TOURNAMENT_HISTORY_STORAGE_KEY =
  "poker-read-tournament-history";

export type TournamentForm = {
  tournamentName: string;
  buyIn: string;
  startingPlayers: string;
  remainingPlayers: string;
  itmPlayers: string;
  heroStack: string;
  averageStack: string;
  smallBlind: string;
  bigBlind: string;
  ante: string;
  level: string;
};

export type SavedTournament = {
  version: 1;
  form: TournamentForm;
  isStarted: true;
  savedAt: string;
};

export type FinishedTournament = {
  id: string;
  version: 1;
  form: TournamentForm;
  finishedAt: string;
  finalHeroBb: number;
};

function isSavedTournament(
  value: unknown,
): value is SavedTournament {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<SavedTournament>;

  return (
    data.version === 1 &&
    data.isStarted === true &&
    typeof data.savedAt === "string" &&
    Boolean(data.form)
  );
}

function isFinishedTournament(
  value: unknown,
): value is FinishedTournament {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<FinishedTournament>;

  return (
    typeof data.id === "string" &&
    data.version === 1 &&
    typeof data.finishedAt === "string" &&
    typeof data.finalHeroBb === "number" &&
    Boolean(data.form)
  );
}

export function loadTournament(): SavedTournament | null {
  try {
    const savedText = window.localStorage.getItem(
      TOURNAMENT_STORAGE_KEY,
    );

    if (!savedText) {
      return null;
    }

    const savedData: unknown = JSON.parse(savedText);

    if (!isSavedTournament(savedData)) {
      window.localStorage.removeItem(
        TOURNAMENT_STORAGE_KEY,
      );
      return null;
    }

    return savedData;
  } catch (error) {
    console.error(
      "大会データの読み込みに失敗しました。",
      error,
    );

    try {
      window.localStorage.removeItem(
        TOURNAMENT_STORAGE_KEY,
      );
    } catch {
      // 削除できない場合は何もしません
    }

    return null;
  }
}

export function saveTournament(
  tournament: SavedTournament,
): boolean {
  try {
    window.localStorage.setItem(
      TOURNAMENT_STORAGE_KEY,
      JSON.stringify(tournament),
    );
    return true;
  } catch (error) {
    console.error(
      "大会データの保存に失敗しました。",
      error,
    );
    return false;
  }
}

export function loadTournamentHistory(): FinishedTournament[] {
  try {
    const savedText = window.localStorage.getItem(
      TOURNAMENT_HISTORY_STORAGE_KEY,
    );

    if (!savedText) {
      return [];
    }

    const parsed: unknown = JSON.parse(savedText);

    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(
        TOURNAMENT_HISTORY_STORAGE_KEY,
      );
      return [];
    }

    return parsed
      .filter(isFinishedTournament)
      .sort(
        (a, b) =>
          new Date(b.finishedAt).getTime() -
          new Date(a.finishedAt).getTime(),
      );
  } catch (error) {
    console.error(
      "大会履歴の読み込みに失敗しました。",
      error,
    );
    return [];
  }
}

export function finishTournament(
  form: TournamentForm,
): FinishedTournament[] | null {
  try {
    const heroStack = Number(
      form.heroStack.replace(/,/g, "").trim(),
    );
    const bigBlind = Number(
      form.bigBlind.replace(/,/g, "").trim(),
    );

    const finalHeroBb =
      Number.isFinite(heroStack) &&
      Number.isFinite(bigBlind) &&
      bigBlind > 0
        ? heroStack / bigBlind
        : 0;

    const finishedTournament: FinishedTournament = {
      id:
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`,
      version: 1,
      form,
      finishedAt: new Date().toISOString(),
      finalHeroBb,
    };

    const history = [
      finishedTournament,
      ...loadTournamentHistory(),
    ].slice(0, 100);

    window.localStorage.setItem(
      TOURNAMENT_HISTORY_STORAGE_KEY,
      JSON.stringify(history),
    );

    window.localStorage.removeItem(
      TOURNAMENT_STORAGE_KEY,
    );

    return history;
  } catch (error) {
    console.error(
      "大会履歴の保存に失敗しました。",
      error,
    );
    return null;
  }
}
