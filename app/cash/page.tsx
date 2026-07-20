import Link from "next/link";

type MenuLinkProps = {
  href: string;
  icon: string;
  title: string;
  className: string;
};

function MenuLink({ href, icon, title, className }: MenuLinkProps) {
  return (
    <Link
      href={href}
      className={`flex min-h-24 items-center gap-4 rounded-3xl border p-5 text-xl font-black shadow-lg transition active:scale-[0.98] ${className}`}
    >
      <span className="text-4xl" aria-hidden="true">{icon}</span>
      <span className="flex-1">{title}</span>
      <span className="text-2xl text-white/40" aria-hidden="true">›</span>
    </Link>
  );
}

export default function CashHomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(48px,calc(env(safe-area-inset-top)+18px))] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-150px] h-[330px] w-[330px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-bold text-emerald-300 active:bg-white/10"
        >
          ← 戻る
        </Link>

        <header className="mb-7 mt-5">
          <p className="text-xs font-black tracking-[0.18em] text-emerald-400">
            CASH GAME
          </p>
          <h1 className="mt-2 text-3xl font-black">
            キャッシュゲーム
          </h1>
        </header>

        <section className="space-y-4">
          <MenuLink
            href="/new-table"
            icon="📝"
            title="新規ハンド"
            className="border-emerald-700 bg-gradient-to-br from-emerald-900 to-emerald-950"
          />
          <MenuLink
            href="/history"
            icon="📚"
            title="ハンド履歴"
            className="border-sky-800 bg-gradient-to-br from-sky-950 to-slate-950"
          />
          <MenuLink
            href="/review"
            icon="🤖"
            title="AIレビュー"
            className="border-amber-800 bg-gradient-to-br from-amber-950 to-slate-950"
          />
        </section>
      </div>
    </main>
  );
}
