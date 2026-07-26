import Image from "next/image";
import Link from "next/link";

type HomeButtonProps = {
  href: string;
  icon: string;
  label: string;
  description?: string;
  className: string;
};

function HomeButton({
  href,
  icon,
  label,
  description,
  className,
}: HomeButtonProps) {
  return (
    <Link
      href={href}
      className={`flex min-h-20 items-center gap-4 rounded-3xl border px-5 py-4 text-left shadow-lg transition hover:brightness-110 active:scale-[0.98] ${className}`}
    >
      <span className="text-3xl" aria-hidden="true">
        {icon}
      </span>

      <span className="flex-1">
        <span className="block text-lg font-black">{label}</span>

        {description && (
          <span className="mt-1 block text-sm font-medium text-white/60">
            {description}
          </span>
        )}
      </span>

      <span className="text-2xl text-white/45" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(40px,calc(env(safe-area-inset-top)+16px))] text-white">
      {/* 背景装飾 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-160px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -left-28 top-1/2 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -right-28 bottom-10 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md">
        {/* ヘッダー */}
        <header className="text-center">
          <h1 className="text-4xl font-black tracking-tight">
            Poker <span className="text-emerald-400">Read</span>
          </h1>

          <div className="mx-auto mt-5 flex h-52 w-52 items-center justify-center overflow-hidden rounded-full border border-emerald-400/30 bg-emerald-950/60 shadow-2xl shadow-emerald-950/60">
            <Image
              src="/icon-512.png"
              alt="KBキャラクター"
              width={208}
              height={208}
              priority
              className="h-full w-full object-cover"
            />
          </div>

          <div className="relative mx-auto mt-4 max-w-sm rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-xl">
            <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-white/10 bg-[#102219]" />

            <p className="relative text-base font-bold leading-7 text-slate-100">
              「今日は何をチェックする？」
            </p>
          </div>
        </header>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* ハンド解析 */}
        <section>
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="text-xl" aria-hidden="true">
              🃏
            </span>

            <div>
              <h2 className="font-black text-white">ハンド解析</h2>
              <p className="text-xs text-white/45">
                プレイしたハンドを振り返る
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <HomeButton
              href="/cash"
              icon="💵"
              label="キャッシュゲーム"
              description="リングゲームのハンドを解析"
              className="border-emerald-700/70 bg-gradient-to-br from-emerald-900 to-emerald-950"
            />

            <HomeButton
              href="/tournament"
              icon="🏆"
              label="トーナメント"
              description="大会でプレイしたハンドを解析"
              className="border-amber-700/70 bg-gradient-to-br from-amber-950 to-slate-950"
            />
          </div>
        </section>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Tournament Navi */}
        <section>
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="text-xl" aria-hidden="true">
              🧠
            </span>

            <div>
              <h2 className="font-black text-white">トーナメントナビ</h2>
              <p className="text-xs text-white/45">
                大会中の進め方をチェック
              </p>
            </div>
          </div>

          <HomeButton
            href="/tournament-navi"
            icon="🧠"
            label="Tournament Navi"
            description="現在のスタックから今やることを診断"
            className="border-violet-700/70 bg-gradient-to-br from-violet-950 to-slate-950"
          />
        </section>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* 用語辞典 */}
        <HomeButton
          href="/dictionary"
          icon="📖"
          label="ポーカー用語辞典"
          description="分からない用語を調べる"
          className="border-sky-800/70 bg-gradient-to-br from-sky-950 to-slate-950"
        />
      </div>
    </main>
  );
}