import Link from "next/link";

export default function NewHandPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="mb-6 inline-block text-sm font-semibold text-slate-400"
        >
          ← ホームへ戻る
        </Link>

        <h1 className="mb-2 text-3xl font-bold">新しいハンド</h1>

        <p className="mb-8 text-slate-400">
          今回はどちらのテーブルですか？
        </p>

        <div className="space-y-4">
          <button
            type="button"
            className="w-full cursor-not-allowed rounded-2xl border border-slate-700 bg-slate-900 p-5 text-left opacity-60"
          >
            <div className="text-lg font-bold">
              同じテーブルで続ける
            </div>

            <div className="mt-1 text-sm text-slate-400">
              前回のテーブル情報を引き継ぎます
            </div>

            <div className="mt-3 text-xs text-amber-300">
              テーブル保存後に利用できます
            </div>
          </button>

          <Link
            href="/new-table"
            className="block w-full rounded-2xl bg-emerald-500 p-5 text-left text-slate-950 transition active:scale-95"
          >
            <div className="text-lg font-bold">
              新しいテーブルを開始
            </div>

            <div className="mt-1 text-sm">
              開催場所・SB/BB・スタックを入力します
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}