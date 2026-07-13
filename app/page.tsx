import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold text-emerald-400">
            HAND READING TRAINER
          </p>

          <h1 className="text-3xl font-bold">
            Poker Read App
          </h1>

          <p className="mt-3 leading-7 text-slate-400">
            相手のアクションと予想レンジを素早く記録し、
            読みのズレを振り返るためのアプリです。
          </p>
        </header>

        <section className="space-y-4">
<Link
  href="/new-hand"
  className="block w-full rounded-2xl bg-emerald-500 px-5 py-5 text-left text-lg font-bold text-slate-950 shadow-lg transition active:scale-95"
>
  <span className="block text-sm font-semibold">
    NEW HAND
  </span>
  新規ハンドを記録
</Link>

          <Link
  href="/history"
  className="block w-full rounded-2xl border border-slate-700 bg-slate-900 px-5 py-5 text-left transition active:scale-95"
>
  <span className="block text-sm font-semibold text-slate-400">
    HAND HISTORY
  </span>

  <span className="mt-1 block text-lg font-bold">
    ハンド一覧
  </span>
</Link>
          <button className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-5 py-5 text-left text-lg font-bold transition active:scale-95">
            <span className="block text-sm font-semibold text-slate-400">
              REVIEW
            </span>
            振り返り
          </button>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            現在の記録
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-slate-400">保存ハンド</p>
            </div>

            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-slate-400">読み直し</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}