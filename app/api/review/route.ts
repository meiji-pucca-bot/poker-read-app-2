import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OpenAI APIキーが設定されていません。",
        },
        {
          status: 500,
        },
      );
    }

    const body = await request.json();
    const hand = body?.hand;

    if (!hand) {
      return NextResponse.json(
        {
          error:
            "レビュー対象のハンドがありません。",
        },
        {
          status: 400,
        },
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      instructions: `
あなたは初心者向けの優秀なテキサスホールデム・ポーカーコーチです。

入力されたハンド履歴を分析してください。

必ず以下を守ってください。

- 日本語で回答する
- 初心者にも理解できる表現にする
- 難しいGTO用語を使う場合は短く説明する
- 勝敗だけで判断しない
- プリフロップ、フロップ、ターン、リバーを分ける
- Heroだけでなく、相手の各アクションも評価する
- ベットサイズ、ポット、ポジション、スタックを考慮する
- 情報が不足している場合は断定しない
- 各ストリートについて「良かった点」「改善点」を書く
- 最後に「総合評価」「次回の学習ポイント」を書く
- 違法なリアルタイム支援ではなく、終了後の学習レビューとして回答する

回答は次の見出し構成にしてください。

# 総合評価
# プリフロップ
# フロップ
# ターン
# リバー
# 良かった点
# 改善点
# 次回の学習ポイント
      `,
      input: `
以下は終了済みのポーカーハンド履歴です。

${JSON.stringify(hand, null, 2)}
      `,
    });

    return NextResponse.json({
      review: response.output_text,
    });
  } catch (error) {
    console.error("AI review error:", error);

    return NextResponse.json(
      {
        error:
          "AIレビューの生成中にエラーが発生しました。",
      },
      {
        status: 500,
      },
    );
  }
}