import OpenAI from "openai";
import { NextResponse } from "next/server";

import type {
  OcrConfidence,
  TournamentOcrResult,
} from "@/lib/tournament-ocr";
import type {
  TournamentForm,
} from "@/lib/tournament-storage";

export const runtime = "nodejs";

const MAX_DATA_URL_LENGTH = 12_000_000;
const ALLOWED_PREFIXES = [
  "data:image/jpeg;base64,",
  "data:image/png;base64,",
  "data:image/webp;base64,",
];

const EMPTY_FORM: TournamentForm = {
  tournamentName: "",
  buyIn: "",
  startingPlayers: "",
  remainingPlayers: "",
  itmPlayers: "",
  heroStack: "",
  averageStack: "",
  smallBlind: "",
  bigBlind: "",
  ante: "",
  level: "",
};

function extractJson(value: string): string {
  const fenced = value.match(
    /```(?:json)?\s*([\s\S]*?)```/i,
  );

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");

  if (
    firstBrace >= 0 &&
    lastBrace > firstBrace
  ) {
    return value.slice(firstBrace, lastBrace + 1);
  }

  return value;
}

function stringValue(value: unknown): string {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return String(value);
  }

  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeNumericText(
  value: unknown,
): string {
  const text = stringValue(value);

  if (!text) {
    return "";
  }

  const normalized = text
    .replace(/[,\s]/g, "")
    .replace(/[^\d.-]/g, "");

  return normalized;
}

function normalizeForm(
  value: unknown,
): TournamentForm {
  const data =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    tournamentName: stringValue(
      data.tournamentName,
    ),
    buyIn: normalizeNumericText(data.buyIn),
    startingPlayers: normalizeNumericText(
      data.startingPlayers,
    ),
    remainingPlayers: normalizeNumericText(
      data.remainingPlayers,
    ),
    itmPlayers: normalizeNumericText(
      data.itmPlayers,
    ),
    heroStack: normalizeNumericText(
      data.heroStack,
    ),
    averageStack: normalizeNumericText(
      data.averageStack,
    ),
    smallBlind: normalizeNumericText(
      data.smallBlind,
    ),
    bigBlind: normalizeNumericText(
      data.bigBlind,
    ),
    ante: normalizeNumericText(data.ante),
    level: stringValue(data.level),
  };
}

function normalizeConfidence(
  value: unknown,
): OcrConfidence {
  return value === "high" ||
    value === "medium" ||
    value === "low"
    ? value
    : "low";
}

function normalizeNotes(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [
      "画像から読み取れない項目は空欄です。内容を確認してください。",
    ];
  }

  const notes = value
    .filter(
      (item): item is string =>
        typeof item === "string" &&
        item.trim().length > 0,
    )
    .map((item) => item.trim())
    .slice(0, 5);

  return notes.length > 0
    ? notes
    : [
        "抽出結果を確認してからTournament Naviへ進んでください。",
      ];
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEYが設定されていません。",
        },
        { status: 503 },
      );
    }

    const body =
      (await request.json()) as {
        imageDataUrl?: unknown;
      };

    if (
      typeof body.imageDataUrl !== "string" ||
      !ALLOWED_PREFIXES.some((prefix) =>
        body.imageDataUrl!.startsWith(prefix),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "対応している画像形式はPNG・JPEG・WebPです。",
        },
        { status: 400 },
      );
    }

    if (
      body.imageDataUrl.length >
      MAX_DATA_URL_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            "画像データが大きすぎます。8MB以下の画像を使用してください。",
        },
        { status: 413 },
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response =
      await client.responses.create({
        model:
          process.env.OPENAI_OCR_MODEL ||
          "gpt-5-mini",
        instructions: `
あなたはポーカートーナメント画面の画像読取アシスタントです。
画像に明確に表示されている情報だけを抽出してください。

重要:
- 推測で数字を埋めない。
- 読めない項目は必ず空文字にする。
- チップ数・人数・ブラインド・バイインは数字だけにする。
- 通貨記号やカンマは除く。
- "Blinds 500/1000 Ante 100" は smallBlind=500, bigBlind=1000, ante=100。
- Hero stackはユーザー本人のスタック。平均スタックと混同しない。
- Players 120/450 のような表示は、文脈を確認してremainingPlayersとstartingPlayersへ割り当てる。
- Paid places、Places paid、ITMなどはitmPlayersに入れる。
- 大会名やプラットフォームが不明なら空文字。
- JSON以外を出力しない。

JSON形式:
{
  "form": {
    "tournamentName": "",
    "buyIn": "",
    "startingPlayers": "",
    "remainingPlayers": "",
    "itmPlayers": "",
    "heroStack": "",
    "averageStack": "",
    "smallBlind": "",
    "bigBlind": "",
    "ante": "",
    "level": ""
  },
  "confidence": "high|medium|low",
  "detectedPlatform": "",
  "notes": ["確認が必要な点"]
}
        `,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "このスクリーンショットから、現在のポーカートーナメント情報を抽出してください。",
              },
              {
                type: "input_image",
                image_url:
                  body.imageDataUrl,
                detail: "high",
              },
            ],
          },
        ],
      });

    const outputText =
      response.output_text?.trim();

    if (!outputText) {
      throw new Error(
        "OpenAIから解析結果が返されませんでした。",
      );
    }

    const parsed: unknown = JSON.parse(
      extractJson(outputText),
    );

    const data =
      parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : {};

    const result: TournamentOcrResult = {
      form: normalizeForm(
        data.form || EMPTY_FORM,
      ),
      confidence: normalizeConfidence(
        data.confidence,
      ),
      detectedPlatform: stringValue(
        data.detectedPlatform,
      ),
      notes: normalizeNotes(data.notes),
      extractedAt: new Date().toISOString(),
    };

    const hasAnyValue = Object.values(
      result.form,
    ).some((value) => value.length > 0);

    if (!hasAnyValue) {
      return NextResponse.json(
        {
          error:
            "大会情報を読み取れませんでした。文字が大きく写っている画像をお試しください。",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error(
      "Tournament OCR error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message.includes("429") ||
      message.includes(
        "insufficient_quota",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "OpenAI APIの残高または利用上限を確認してください。",
        },
        { status: 429 },
      );
    }

    if (
      message.includes("image") &&
      message.includes("unsupported")
    ) {
      return NextResponse.json(
        {
          error:
            "画像を解析できませんでした。別のPNG・JPEG・WebP画像をお試しください。",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          "画像解析中にエラーが発生しました。時間をおいて再度お試しください。",
      },
      { status: 500 },
    );
  }
}
