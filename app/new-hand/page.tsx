import Link from "next/link";

export default function NewHandPage() {
  return (
     <main className="min-h-screen bg-slate-950 px-6 pb-6 pt-[max(56px,calc(env(safe-area-inset-top)+20px))] text-white">
      <div className="mx-auto max-w-md">

        <Link
          href="/"
          className="mb-6 inline-block text-sm font-semibold text-slate-400"
        >
          ← ホームへ戻る
        </Link>

        <h1 className="mb-2 text-3xl font-bold">
          新しいハンド
        </h1>

        <p className="mb-8 text-slate-400">
          プレイするゲームを選択してください
        </p>

        <div className="space-y-4">

          <Link
            href="/new-table"
            className="block rounded-2xl bg-emerald-500 p-6 text-slate-950"
          >
            <div className="text-2xl">
              💵
            </div>

            <div className="mt-2 text-xl font-bold">
              キャッシュゲーム
            </div>

            <div className="mt-1 text-sm">
              リングゲーム・キャッシュゲームはこちら
            </div>
          </Link>

          <Link
            href="/tournament"
            className="block rounded-2xl bg-sky-600 p-6"
          >
            <div className="text-2xl">
              🏆
            </div>

            <div className="mt-2 text-xl font-bold">
              トーナメント
            </div>

            <div className="mt-1 text-sm text-slate-200">
              MTT・サテライト・Sit&Goはこちら
            </div>
          </Link>

        </div>

      </div>
    </main>
  );
}