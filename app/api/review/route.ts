import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type StreetReview = {
  score: number;
  verdict: string;
  heroAction: string;
  recommendedAction: string;
  goodPoints: string[];
  improvementPoints: string[];
  detail: string;
};

type AiReview = {
  totalScore: number;
  grade: string;
  stars: number;
  shortSummary: string;
  strongestStreet: string;
  mainLeak: string;
  goodPoints: string[];
  improvementPoints: string[];
  streets: {
    preflop: StreetReview;
    flop: StreetReview;
    turn: StreetReview;
    river: StreetReview;
  };
  nextGoals: string[];
  finalMessage: string;
};

function extractJson(text: string) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("AIの回答をJSONとして読み取れませんでした。");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function clampScore(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(number)));
}

function normalizeList(value: unknown, maximum = 3) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maximum);
}

function normalizeStreet(value: unknown): StreetReview {
  const street =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    score: clampScore(street.score),
    verdict:
      typeof street.verdict === "string"
        ? street.verdict
        : "情報不足",
    heroAction:
      typeof street.heroAction === "string"
        ? street.heroAction
        : "記録なし",
    recommendedAction:
      typeof street.recommendedAction === "string"
        ? street.recommendedAction
        : "判断できません",
    goodPoints: normalizeList(street.goodPoints),
    improvementPoints: normalizeList(
      street.improvementPoints,
    ),
    detail:
      typeof street.detail === "string"
        ? street.detail
        : "十分な情報がありません。",
  };
}

function normalizeReview(value: unknown): AiReview {
  const review =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const streets =
    review.streets && typeof review.streets === "object"
      ? (review.streets as Record<string, unknown>)
      : {};

  const totalScore = clampScore(review.totalScore);

  return {
    totalScore,
    grade:
      typeof review.grade === "string"
        ? review.grade
        : totalScore >= 90
          ? "A+"
          : totalScore >= 80
            ? "A"
            : totalScore >= 70
              ? "B"
              : totalScore >= 60
                ? "C"
                : "D",
    stars: Math.max(
      1,
      Math.min(
        5,
        Math.round(Number(review.stars) || totalScore / 20),
      ),
    ),
    shortSummary:
      typeof review.shortSummary === "string"
        ? review.shortSummary
        : "今回の判断をストリートごとに振り返りましょう。",
    strongestStreet:
      typeof review.strongestStreet === "string"
        ? review.strongestStreet
        : "情報不足",
    mainLeak:
      typeof review.mainLeak === "string"
        ? review.mainLeak
        : "情報不足",
    goodPoints: normalizeList(review.goodPoints),
    improvementPoints: normalizeList(
      review.improvementPoints,
    ),
    streets: {
      preflop: normalizeStreet(streets.preflop),
      flop: normalizeStreet(streets.flop),
      turn: normalizeStreet(streets.turn),
      river: normalizeStreet(streets.river),
    },
    nextGoals: normalizeList(review.nextGoals, 5),
    finalMessage:
      typeof review.finalMessage === "string"
        ? review.finalMessage
        : "次回は、ポジション・相手のレンジ・ベットサイズを意識しましょう。",
  };
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI APIキーが設定されていません。",
        },
        {
          status: 500,
        },
      );
    }

    const body = await request.json();
    const hand = body?.hand;
    const requestedMode =
      body?.mode === "tournament"
        ? "tournament"
        : "cash";
    const handMode =
      hand?.mode === "tournament"
        ? "tournament"
        : requestedMode;
    const isTournament =
      handMode === "tournament";

    if (!hand) {
      return NextResponse.json(
        {
          error: "レビュー対象のハンドがありません。",
        },
        {
          status: 400,
        },
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5-mini",
     instructions: `
あなたは、初心者向けのテキサスホールデム・ポーカーコーチです。
これは終了済みハンドの学習レビューです。

入力されたハンド履歴を、勝敗ではなく「意思決定の質」で評価してください。

${isTournament ? `
【今回のゲーム形式】
- トーナメントハンドとして分析する
- キャッシュゲームの100BB基準をそのまま当てはめない
- 入力されたチップ数をBBへ換算して判断する
- BBアンティをプリフロップのポット計算に含める
- 残り人数、入賞人数、現在順位、大会フェーズを確認する
- considerIcmがtrue、またはバブル・入賞後・FTならICMを考慮する
- ICMは「チップの価値が一定ではない」という意味を初心者向けに説明する
- ショートスタックではPush/Fold、オープンオールイン、リスチールを検討する
- ただし正確な賞金配分がない場合、ICMを断定せず傾向として説明する
- 終了済みハンドの学習レビューとして回答する
` : `
【今回のゲーム形式】
- キャッシュゲームハンドとして分析する
- チップEV、ポジション、有効スタック、SPRを中心に判断する
`}

【分析時に必ず確認すること】
- Heroのハンドとポジション
- 相手の人数とポジション
- Heroと相手のスタック
- 有効スタック
- プリフロップからリバーまでの全アクション
- 各アクションの順番
- ポットサイズ
- ベットサイズとポットに対する割合
- ボードの状況
- ヘッズアップかマルチウェイか
- 相手の想定レンジ
${isTournament ? `- Heroと相手のスタックをBB換算した値
- BBアンティを含む開始ポット
- 残り人数、入賞人数、現在順位
- 序盤・中盤・バブル・ITM・FT・HUのどの段階か
- Push/Foldが必要なスタック帯か
- ICMによってリスク許容度が変わる場面か` : ""}

【回答ルール】
- 日本語で回答する
- 初心者にも分かる言葉を使う
- 難しい用語を使う場合は短く説明する
- 情報不足の場合は断定しない
- 結果が勝ちでも、判断が悪ければ低く評価する
- 結果が負けでも、判断が良ければ高く評価する
- 同じ内容を繰り返さない
- 1項目は原則40文字以内
- detailは最大120文字
- 各配列は最大3項目
- 最重要の改善点を優先する
- Heroが実際に行ったアクションを正確に書く
- 推奨行動は「チェック」「コール」「ベット50% Pot」など具体的に書く
- 推奨が複数ある場合は、最大2つまでにする
- Markdownを使わない
- JSON以外の文字を絶対に出力しない

【採点基準】
90〜100：非常に良い判断
80〜89：良い判断
70〜79：標準的
60〜69：改善余地あり
0〜59：大きな改善が必要

【総合レビューの作り方】
- shortSummaryは2文以内
- strongestStreetは最も良かったストリートと理由を1文
- mainLeakは最大の課題だけを1文
- goodPointsは重要なものを最大3つ
- improvementPointsは重要なものを最大3つ
- nextGoalsは次回すぐ使える行動を最大3つ
- finalMessageは短い励ましと最重要課題を1文

【ストリート別レビューの作り方】
- scoreは0〜100
- verdictは「良い」「標準」「要改善」「情報不足」のいずれか
- heroActionはHeroの実際の行動を短く記載
- recommendedActionは具体的な推奨を短く記載
- goodPointsは最大2つ
- improvementPointsは最大2つ
- detailは「なぜその判断になるか」を初心者向けに最大120文字

次のJSON形式だけで回答してください。

{
  "totalScore": 0,
  "grade": "A",
  "stars": 4,
  "shortSummary": "今回の要点を2文以内",
  "strongestStreet": "最も良かったストリートと理由",
  "mainLeak": "最大の改善点",
  "goodPoints": [
    "良かった点",
    "良かった点"
  ],
  "improvementPoints": [
    "改善点",
    "改善点"
  ],
  "streets": {
    "preflop": {
      "score": 0,
      "verdict": "良い",
      "heroAction": "Heroが実際に行った行動",
      "recommendedAction": "AIの具体的な推奨行動",
      "goodPoints": [
        "良かった点"
      ],
      "improvementPoints": [
        "改善点"
      ],
      "detail": "初心者向けの短い理由"
    },
    "flop": {
      "score": 0,
      "verdict": "標準",
      "heroAction": "Heroが実際に行った行動",
      "recommendedAction": "AIの具体的な推奨行動",
      "goodPoints": [
        "良かった点"
      ],
      "improvementPoints": [
        "改善点"
      ],
      "detail": "初心者向けの短い理由"
    },
    "turn": {
      "score": 0,
      "verdict": "要改善",
      "heroAction": "Heroが実際に行った行動",
      "recommendedAction": "AIの具体的な推奨行動",
      "goodPoints": [
        "良かった点"
      ],
      "improvementPoints": [
        "改善点"
      ],
      "detail": "初心者向けの短い理由"
    },
    "river": {
      "score": 0,
      "verdict": "情報不足",
      "heroAction": "Heroが実際に行った行動",
      "recommendedAction": "AIの具体的な推奨行動",
      "goodPoints": [
        "良かった点"
      ],
      "improvementPoints": [
        "改善点"
      ],
      "detail": "初心者向けの短い理由"
    }
  },
  "nextGoals": [
    "次回すぐ使える課題",
    "次回すぐ使える課題"
  ],
  "finalMessage": "短いコーチコメント"
}
`, 

      input: `
ゲーム形式：${isTournament ? "トーナメント" : "キャッシュゲーム"}

以下は終了済みのハンド履歴です。

${JSON.stringify(hand, null, 2)}
      `,
    });

    const jsonText = extractJson(response.output_text);
    const parsed = JSON.parse(jsonText);
    const review = normalizeReview(parsed);

    return NextResponse.json({
      review,
    });
  } catch (error) {
    console.error("AI review error:", error);

    const message =
      error instanceof Error ? error.message : "";

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
          "AIレビューの生成中にエラーが発生しました。もう一度お試しください。",
      },
      {
        status: 500,
      },
    );
  }
}