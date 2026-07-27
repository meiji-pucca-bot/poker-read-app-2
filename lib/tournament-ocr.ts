import type { TournamentForm } from "@/lib/tournament-storage";

export const TOURNAMENT_OCR_DRAFT_KEY =
  "poker-read-tournament-ocr-draft-v1";

export const TOURNAMENT_OCR_HISTORY_KEY =
  "poker-read-tournament-ocr-history-v1";

export const OCR_MAX_FILE_SIZE = 8 * 1024 * 1024;

export const OCR_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type OcrConfidence = "high" | "medium" | "low";

export type TournamentOcrResult = {
  form: TournamentForm;
  confidence: OcrConfidence;
  detectedPlatform: string;
  notes: string[];
  extractedAt: string;
};

export type TournamentOcrHistoryItem = {
  id: string;
  result: TournamentOcrResult;
};

function isTournamentForm(
  value: unknown,
): value is TournamentForm {
  if (!value || typeof value !== "object") {
    return false;
  }

  const form = value as Partial<TournamentForm>;
  const fields: Array<keyof TournamentForm> = [
    "tournamentName",
    "buyIn",
    "startingPlayers",
    "remainingPlayers",
    "itmPlayers",
    "heroStack",
    "averageStack",
    "smallBlind",
    "bigBlind",
    "ante",
    "level",
  ];

  return fields.every(
    (field) => typeof form[field] === "string",
  );
}

function isOcrResult(
  value: unknown,
): value is TournamentOcrResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result =
    value as Partial<TournamentOcrResult>;

  return (
    isTournamentForm(result.form) &&
    (result.confidence === "high" ||
      result.confidence === "medium" ||
      result.confidence === "low") &&
    typeof result.detectedPlatform === "string" &&
    Array.isArray(result.notes) &&
    result.notes.every(
      (note) => typeof note === "string",
    ) &&
    typeof result.extractedAt === "string"
  );
}

export function validateOcrFile(
  file: File,
): string | null {
  if (
    !OCR_ACCEPTED_TYPES.includes(
      file.type as (typeof OCR_ACCEPTED_TYPES)[number],
    )
  ) {
    return "PNG・JPEG・WebP形式の画像を選択してください。";
  }

  if (file.size > OCR_MAX_FILE_SIZE) {
    return "画像サイズは8MB以下にしてください。";
  }

  return null;
}

export function fileToDataUrl(
  file: File,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(
        new Error(
          "画像を読み込めませんでした。",
        ),
      );
    };

    reader.onerror = () => {
      reject(
        new Error(
          "画像を読み込めませんでした。",
        ),
      );
    };

    reader.readAsDataURL(file);
  });
}

export function saveOcrDraft(
  form: TournamentForm,
): boolean {
  try {
    window.localStorage.setItem(
      TOURNAMENT_OCR_DRAFT_KEY,
      JSON.stringify(form),
    );
    return true;
  } catch (error) {
    console.error(
      "OCR結果の保存に失敗しました。",
      error,
    );
    return false;
  }
}

export function loadOcrDraft():
  | TournamentForm
  | null {
  try {
    const raw = window.localStorage.getItem(
      TOURNAMENT_OCR_DRAFT_KEY,
    );

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    return isTournamentForm(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function clearOcrDraft(): void {
  try {
    window.localStorage.removeItem(
      TOURNAMENT_OCR_DRAFT_KEY,
    );
  } catch {
    // localStorageを使用できない場合は何もしません。
  }
}

export function loadOcrHistory(): TournamentOcrHistoryItem[] {
  try {
    const raw = window.localStorage.getItem(
      TOURNAMENT_OCR_HISTORY_KEY,
    );

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (
        item,
      ): item is TournamentOcrHistoryItem => {
        if (!item || typeof item !== "object") {
          return false;
        }

        const candidate =
          item as Partial<TournamentOcrHistoryItem>;

        return (
          typeof candidate.id === "string" &&
          isOcrResult(candidate.result)
        );
      },
    );
  } catch {
    return [];
  }
}

export function addOcrHistory(
  result: TournamentOcrResult,
): TournamentOcrHistoryItem[] {
  const item: TournamentOcrHistoryItem = {
    id:
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
    result,
  };

  const history = [
    item,
    ...loadOcrHistory(),
  ].slice(0, 10);

  try {
    window.localStorage.setItem(
      TOURNAMENT_OCR_HISTORY_KEY,
      JSON.stringify(history),
    );
  } catch (error) {
    console.error(
      "OCR履歴の保存に失敗しました。",
      error,
    );
  }

  return history;
}

export function clearOcrHistory(): void {
  try {
    window.localStorage.removeItem(
      TOURNAMENT_OCR_HISTORY_KEY,
    );
  } catch {
    // localStorageを使用できない場合は何もしません。
  }
}
