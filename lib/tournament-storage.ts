export const TOURNAMENT_STORAGE_KEY =
  "poker-read-active-tournament";

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

export function loadTournament(): SavedTournament | null {
  try {
    const savedText = window.localStorage.getItem(
      TOURNAMENT_STORAGE_KEY,
    );

    if (!savedText) {
      return null;
    }

    const savedData = JSON.parse(
      savedText,
    ) as Partial<SavedTournament>;

    if (
      savedData.version !== 1 ||
      !savedData.form ||
      savedData.isStarted !== true ||
      typeof savedData.savedAt !== "string"
    ) {
      window.localStorage.removeItem(
        TOURNAMENT_STORAGE_KEY,
      );

      return null;
    }

    return savedData as SavedTournament;
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

export function deleteTournament(): boolean {
  try {
    window.localStorage.removeItem(
      TOURNAMENT_STORAGE_KEY,
    );

    return true;
  } catch (error) {
    console.error(
      "大会データの削除に失敗しました。",
      error,
    );

    return false;
  }
}
