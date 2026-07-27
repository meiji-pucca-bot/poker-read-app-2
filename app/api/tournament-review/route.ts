import OpenAI from "openai";
import { NextResponse } from "next/server";

import type {
  TournamentAiReview,
  TournamentReviewRequest,
} from "@/lib/tournament-review";
import type {
  FinishedTournament,
} from "@/lib/tournament-storage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";

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
    (value) => Number.isFinite(value) && value >= 0,
  );

  if (validValues.length === 0) {
    return 0;
  }

  return (
    validValues.reduce((sum, value) => sum + value, 0) /
    validValues.length
  );
}

function summarizeHistory(
  tournaments: FinishedTournament[],
) {
  const itmCount = tournaments.filter((tournament) => {
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
  }).length;

  const finalBbs = tournaments.map(
    (tournament) => tournament.finalHeroBb,
  );

  const buyIns = tournaments
    .map((tournament) =>
      toNumber(tournament.form.buyIn),
    )
    .filter((value) => value > 0);

  return {
    tournamentCount: tournaments.length,
    estimatedItmCount: itmCount,
    estimatedItmRate:
      tournaments.length > 0
        ? (itmCount / tournaments.length) * 100
        : 0,
    averageFinalHeroBb: average(finalBbs),
    latestFinalHeroBb:
      tournaments[0]?.finalHeroBb ?? 0,
    bestFinalHeroBb:
      finalBbs.length > 0
        ? Math.max(...finalBbs)
        : 0,
    averageBuyIn: average(buyIns),
    records: tournaments.slice(0, 30).map(
      (tournament) => ({
        tournamentName:
          tournament.form.tournamentName.trim() ||
          "名称未入力の大会",
        finishedAt: tournament.finishedAt,
        finalHeroBb: tournament.finalHeroBb,
        startingPlayers: toNumber(
          tournament.form.startingPlayers,
        ),
        remainingPlayers: toNumber(
          tournament.form.remainingPlayers,
        ),
        itmPlayers: toNumber(
          tournament.form.itmPlayers,
        ),
        heroStack: toNumber(
          tournament.form.heroStack,
        ),
        averageStack: toNumber(
          tournament.form.averageStack,
        ),
        bigBlind: toNumber(
          tournament.form.bigBlind,
        ),
        level: tournament.form.level,
        buyIn: toNumber(
          tournament.form.buyIn,
        ),
      }),
    ),
  };
}

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

function textArray(
  value: unknown,
  fallback: string[],
): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .filter(
      (item): item is string =>
        typeof item === "string" &&
        item.trim().length > 0,
    )
    .map((item) => item.trim())
    .slice(0, 4);

  return items.length > 0 ? items : fallback;
}

function textValue(
  value: unknown,
  fallback: string,
): string {
  return typeof value === "string" &&
    value.trim().length > 0
    ? value.trim()
    : fallback;
}

function normalizeReview(
  value: unknown,
  tournamentCount: number,
): TournamentAiReview {
  const data =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const rawGrade = textValue(
    data.grade,
    "C",
  ).toUpperCase();

  const grade:
    | "A"
    | "B"
    | "C"
    | "D" =
    rawGrade === "A" ||
    rawGrade === "B" ||
    rawGrade === "C" ||
    rawGrade === "D"
      ? rawGrade
      : "C";

  const scoreValue = Number(data.score);
  const score = Number.isFinite(scoreValue)
    ? Math.min(100, Math.max(0, Math.round(scoreValue)))
    : 60;

  return {
    grade,
    score,
    headline: textValue(
      data.headline,
      "記録を継続しながら傾向を確認しましょう",
    ),
    summary: textValue(
      data.summary,
      "大会履歴から確認できる範囲で、現在の傾向を整理しました。",
    ),
    strengths: textArray(data.strengths, [
      "大会結果を記録できていること",
    ]),
    improvements: textArray(data.improvements, [
      "より多くの大会データを蓄積すること",
    ]),
    nextGoals: textArray(data.nextGoals, [
      "次の大会でも終了時の情報を保存する",
    ]),
    trend: textValue(
      data.trend,
      "現時点では明確な推移を断定できません。",
    ),
    stackAdvice: textValue(
      data.stackAdvice,
      "終了時BBだけではプレイ内容を断定できないため、ハンドレビューも併用してください。",
    ),
    itmAdvice: textValue(
      data.itmAdvice,
      "ITM率は残り人数とITM人数から推定しています。",
    ),
    finalMessage: textValue(
      data.finalMessage,
      "記録を続けるほど、より具体的な振り返りができます。",
    ),
    dataNotes: textArray(data.dataNotes, [
      "この評価は保存された大会情報だけを使用しています。",
      "順位・賞金・各ハンドの意思決定は含まれていません。",
    ]),
    generatedAt: new Date().toISOString(),
    tournamentCount,
  };
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEYが設定されていません。",
        },
        {
          status: 503,
        },
      );
    }

    const body =
      (await request.json()) as Partial<TournamentReviewRequest>;

    const tournaments = Array.isArray(
      body.tournaments,
    )
      ? body.tournaments.slice(0, 30)
      : [];

    if (tournaments.length === 0) {
      return NextResponse.json(
        {
          error:
            "レビュー対象の大会履歴がありません。",
        },
        {
          status: 400,
        },
      );
    }

    const summary = summarizeHistory(
      tournaments,
    );

    const response =
      await openai.responses.create({
        model:
          process.env.OPENAI_REVIEW_MODEL ||
          "gpt-5-mini",
        instructions: `
あなたは初心者向けのテキサスホールデム・トーナメントコーチです。
入力された大会履歴だけを根拠に、日本語で短く実践的にレビューしてください。

重要な制約:
- 保存されていないプレイ内容、順位、賞金、収支を推測しない。
- 終了時BBが低いことだけでプレイミスと断定しない。
- ITMは「残り人数 <= ITM人数」で計算した推定値として扱う。
- 大会数が少ない場合は、傾向を断定せずデータ不足を明記する。
- 初心者を責めない、やさしいコーチ口調にする。
- 回答は必ずJSONだけにする。
- 各配列は2〜4項目にする。

JSON形式:
{
  "grade": "A|B|C|D",
  "score": 0,
  "headline": "短い見出し",
  "summary": "全体要約",
  "strengths": ["良い点"],
  "improvements": ["改善点"],
  "nextGoals": ["次回の具体的な課題"],
  "trend": "終了時BBなどから見える傾向",
  "stackAdvice": "スタック管理についての注意",
  "itmAdvice": "推定ITM率についての説明と助言",
  "finalMessage": "短い励まし",
  "dataNotes": ["分析上の注意点"]
}
        `,
        input: JSON.stringify(
          summary,
          null,
          2,
        ),
      });

    const parsed = JSON.parse(
      extractJson(response.output_text),
    );

    const review = normalizeReview(
      parsed,
      tournaments.length,
    );

    return NextResponse.json({
      review,
      reviewVersion: 1,
    });
  } catch (error) {
    console.error(
      "Tournament AI review error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message.includes("429") ||
      message.includes("insufficient_quota")
    ) {
      return NextResponse.json(
        {
          error:
            "OpenAI APIの残高または利用上限を確認してください。",
        },
        {
          status: 429,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "AIレビューの生成中にエラーが発生しました。時間をおいてもう一度お試しください。",
      },
      {
        status: 500,
      },
    );
  }
}
