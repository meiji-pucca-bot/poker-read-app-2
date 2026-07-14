import Link from "next/link";
import BottomNav from "@/components/BottomNav";

type MenuCardProps = {
  href: string;
  englishTitle: string;
  japaneseTitle: string;
  description: string;
  symbol: string;
  symbolClassName: string;
  cardClassName: string;
};

function MenuCard({
  href,
  englishTitle,
  japaneseTitle,
  description,
  symbol,
  symbolClassName,
  cardClassName,
}: MenuCardProps) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-3xl border p-5 transition active:scale-[0.98] ${cardClassName}`}
    >
      <div className="absolute -right-4 -top-7 text-[110px] font-black opacity-10">
        {symbol}
      </div>

      <div className="relative flex items-start gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-4xl shadow-lg ${symbolClassName}`}
        >
          {symbol}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black tracking-[0.18em] text-white/60">
            {englishTitle}
          </p>

          <h2 className="mt-1 text-2xl font-black">
            {japaneseTitle}
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/70">
            {description}
          </p>
        </div>

        <span className="mt-4 text-2xl font-black text-white/50 transition group-hover:translate-x-1">
          ›
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-4 py-8 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-140px] h-[330px] w-[330px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="absolute -left-28 top-1/3 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />

        <div className="absolute -right-28 bottom-12 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md">
        <header className="mb-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black tracking-[0.2em] text-emerald-400">
                HAND READING TRAINER
              </p>

              <h1 className="mt-2 text-4xl font-black leading-tight">
                POKER
                <span className="ml-2 text-emerald-400">
                  READ
                </span>
              </h1>
            </div>

            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute -left-1 top-2 rotate-[-14deg] rounded-xl border border-white/30 bg-white px-3 py-2 text-3xl font-black text-red-500 shadow-xl">
                A♥
              </div>

              <div className="absolute right-0 top-0 rotate-[12deg] rounded-xl border border-white/30 bg-white px-3 py-2 text-3xl font-black text-slate-950 shadow-xl">
                A♠
              </div>
            </div>
          </div>

          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
            ハンドを記録して、振り返って、強くなる。
            ポーカー学習を1つにまとめたトレーニングアプリです。
          </p>
        </header>

        <section className="mb-6 rounded-3xl border border-emerald-800/70 bg-emerald-950/50 p-5 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-dashed border-amber-300 bg-red-600 text-lg font-black">
              1
            </div>

            <div>
              <p className="text-xs font-bold text-emerald-300">
                START HERE
              </p>

              <p className="mt-1 font-black">
                まずは1ハンド記録してみましょう
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <MenuCard
            href="/new-hand"
            englishTitle="NEW HAND"
            japaneseTitle="新規ハンド"
            description="テーブル情報からリバーまで、プレイ内容を順番に記録します。"
            symbol="♠"
            symbolClassName="border-emerald-300/40 bg-emerald-400 text-slate-950"
            cardClassName="border-emerald-700 bg-gradient-to-br from-emerald-900 to-emerald-950 shadow-lg shadow-emerald-950/40"
          />

          <MenuCard
            href="/history"
            englishTitle="HAND HISTORY"
            japaneseTitle="ハンド履歴"
            description="保存したハンドと、各ストリートの全アクションを確認します。"
            symbol="♣"
            symbolClassName="border-sky-300/40 bg-sky-400 text-slate-950"
            cardClassName="border-sky-900 bg-gradient-to-br from-sky-950 to-slate-950 shadow-lg shadow-sky-950/30"
          />

          <MenuCard
            href="/review"
            englishTitle="AI REVIEW"
            japaneseTitle="AIレビュー"
            description="保存したハンドをAIコーチが分析し、良かった点と改善点を整理します。"
            symbol="♦"
            symbolClassName="border-amber-300/50 bg-amber-300 text-red-700"
            cardClassName="border-amber-800 bg-gradient-to-br from-amber-950 to-slate-950 shadow-lg shadow-amber-950/30"
          />

          <MenuCard
            href="/dictionary"
            englishTitle="POKER DICTIONARY"
            japaneseTitle="ポーカー用語辞典"
            description="分からないポーカー用語を、初心者向けの説明と例で調べられます。"
            symbol="♥"
            symbolClassName="border-red-300/40 bg-red-500 text-white"
            cardClassName="border-red-900 bg-gradient-to-br from-red-950 to-slate-950 shadow-lg shadow-red-950/30"
          />
        </section>

        <section className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white/50">
                CURRENT FEATURES
              </p>

              <p className="mt-1 text-lg font-black">
                4つの機能に集中
              </p>
            </div>

            <div className="flex gap-2 text-2xl">
              <span className="text-slate-100">♠</span>
              <span className="text-red-400">♥</span>
              <span className="text-red-400">♦</span>
              <span className="text-slate-100">♣</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-black/20 p-3">
              <p className="font-bold text-emerald-300">
                記録する
              </p>

              <p className="mt-1 text-white/60">
                新規ハンド
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-3">
              <p className="font-bold text-sky-300">
                振り返る
              </p>

              <p className="mt-1 text-white/60">
                ハンド履歴
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-3">
              <p className="font-bold text-amber-300">
                分析する
              </p>

              <p className="mt-1 text-white/60">
                AIレビュー
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-3">
              <p className="font-bold text-red-300">
                調べる
              </p>

              <p className="mt-1 text-white/60">
                用語辞典
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-8 text-center">
          <p className="text-xs text-white/30">
            ♠ POKER READ APP ♥
          </p>
        </footer>
      </div>

      <BottomNav />
    </main>
  );
}