export type PokerMode = "cash" | "tournament";

const MODE_STORAGE_KEY = "poker-read-mode";

export function getPokerMode(): PokerMode {
  if (typeof window === "undefined") {
    return "cash";
  }

  const savedMode = window.localStorage.getItem(
    MODE_STORAGE_KEY,
  );

  return savedMode === "tournament"
    ? "tournament"
    : "cash";
}

export function setPokerMode(
  mode: PokerMode,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    MODE_STORAGE_KEY,
    mode,
  );
}

export function isTournamentMode(): boolean {
  return getPokerMode() === "tournament";
}

export function getModeStorageKey(
  cashKey: string,
): string {
  const mode = getPokerMode();

  if (mode === "cash") {
    return cashKey;
  }

  if (cashKey.startsWith("poker-read-")) {
    return cashKey.replace(
      "poker-read-",
      "poker-read-tournament-",
    );
  }

  return `tournament-${cashKey}`;
}

export function getModePath(
  cashPath: string,
): string {
  const mode = getPokerMode();

  if (mode === "cash") {
    return cashPath;
  }

  if (cashPath === "/") {
    return "/tournament";
  }

  return `/tournament${cashPath}`;
}