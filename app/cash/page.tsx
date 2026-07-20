"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const HANDS_STORAGE_KEY = "poker-read-hands";
const CURRENT_TABLE_KEY = "poker-read-current-table";
const TABLE_DRAFT_KEY = "poker-read-table-draft";

type CashHand = {
  id?: string;
  result?: {
    type?: "win" | "lose" | "chop";
  };
};

type SavedTable = {
  id?: string;
  venue?: string;
  tableName?: string;
  smallBlind?: string;
  bigBlind?: string;
  heroStack?: string;
};

type MenuButtonProps = {
  title: string;
  englishTitle: string;
  description: string;
  symbol: string;
  className: string;
  onClick: () => void;
  disabled?: boolean;
};

type MenuLinkProps = {
  href: string;
  title: string;
  englishTitle: string;
  description: string;
  symbol: string;
  className: string;
};

function safeParse<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readCashHands(): CashHand[] {
  const saved = localStorage.getItem(HANDS_STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function MenuButton({
  title,
  englishTitle,
  description,
  symbol,
  className,
  onClick,
  disabled = false,
}: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`block w-full text-left ${
        disabled ? "cursor-not-allowed opacity-45" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-3xl border p-5 shadow-xl transition ${
          disabled ? "" : "active:scale-[0.98]"
        } ${className}`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 -top-8 text-[110px] font-black opacity-10"
        >
          {symbol}
        </span>

        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-black/20 text-4xl">
            {symbol}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-black tracking-[0.18em] text-white/50">
              {englishTitle}
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/65">
              {description}
            </p>
          </div>

          <span
            aria-hidden="true"
            className="text-2xl text-white/40"
          >
            ›
          </span>
        </div>
      </div>
    </button>
  );
}

function MenuLink({
  href,
  title,
  englishTitle,
  description,
  symbol,
  className,
}: MenuLinkProps) {
  return (
    <Link href={href} className="block">
      <div
        className={`relative overflow-hidden rounded-3xl border p-5 shadow-xl transition active:scale-[0.98] ${className}`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 -top-8 text-[110px] font-black opacity-10"
        >
          {symbol}
        </span>

        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-black/20 text-4xl">
            {symbol}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-black tracking-[0.18em] text-white/50">
              {englishTitle}
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/65">
              {description}
            </p>
          </div>

          <span
            aria-hidden="true"
            className="text-2xl text-white/40"
          >
            ›
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CashHomePage() {
  const router = useRouter();

  const [handCount, setHandCount] = useState(0);
  const [winCount, setWinCount] = useState(0);
  const [hasCurrentTable, setHasCurrentTable] =
    useState(false);

  useEffect(() => {
    const hands = readCashHands();

    setHandCount(hands.length);
    setWinCount(
      hands.filter(
        (hand) => hand.result?.type === "win",
      ).length,
    );

    const currentTable = safeParse<SavedTable>(
      localStorage.getItem(CURRENT_TABLE_KEY),
    );

    setHasCurrentTable(
      Boolean(
        currentTable &&
          (currentTable.venue ||
            currentTable.tableName ||
            currentTable.smallBlind ||
            currentTable.bigBlind),
      ),
    );
  }, []);

  function startNewCashHand() {
    localStorage.removeItem(TABLE_DRAFT_KEY);
    localStorage.removeItem(CURRENT_TABLE_KEY);

    router.push("/new-table");
  }

  function startWithSameConditions() {
    const currentTable = safeParse<SavedTable>(
      localStorage.getItem(CURRENT_TABLE_KEY),
    );

    if (!currentTable) {
      return;
    }

    router.push("/hero-hand");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03140d] px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(56px,calc(env(safe-area-inset-top)+20px))] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-160px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="absolute -left-28 top-1/3 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />

        <div className="absolute -right-24 bottom-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.08),transparent_38%)]" />
      </div>

      <div className="relative mx-auto max-w-md">
        <header className="mb-7">
          <Link
            href="/"
            className="relative z-20 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-bold text-emerald-300 active:bg-white/10"
          >
            ← 戻る
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-300 via-emerald-500 to-green-800 text-4xl shadow-xl shadow-emerald-950/60">
              ♠
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black tracking-[0.2em] text-emerald-300">
                CASH GAME MODE
              </p>

              <h1 className="mt-1 text-3xl font-black">
                キャッシュゲーム
              </h1>

              <p className="mt-1 text-sm text-white/50">
                ポジション・レンジ・期待値を意識
              </p>
            </div>
          </div>
        </header>

        <section className="mb-5 rounded-3xl border border-emerald-700/60 bg-gradient-to-br from-emerald-950/90 via-green-950/70 to-black/50 p-5 shadow-xl shadow-black/30">
          <p className="text-xs font-black tracking-[0.05em] text-emerald-300">
            CASH GAME STATUS
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/5 bg-black/25 p-4">
              <p className="text-xs text-white/40">
                保存ハンド
              </p>

              <p className="mt-1 text-3xl font-black">
                {handCount}
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/25 p-4">
              <p className="text-xs text-white/40">
                勝ち
              </p>

              <p className="mt-1 text-3xl font-black text-emerald-300">
                {winCount}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <MenuButton
            title="新規ハンド"
            englishTitle="NEW CASH HAND"
            description="新しいテーブル情報を入力して、キャッシュゲームのハンドを記録します。"
            symbol="♠"
            className="border-green-600/80 bg-gradient-to-br from-green-800 via-emerald-900 to-emerald-950"
            onClick={startNewCashHand}
          />

          <MenuButton
            title="同条件で新規"
            englishTitle="NEW WITH SAME CONDITIONS"
            description={
              hasCurrentTable
                ? "前回のテーブル情報とブラインドを引き継いで、新しいハンドを記録します。"
                : "引き継げるテーブル情報がまだありません。"
            }
            symbol="♥"
            className="border-teal-600/70 bg-gradient-to-br from-teal-900 via-emerald-950 to-slate-950"
            onClick={startWithSameConditions}
            disabled={!hasCurrentTable}
          />

          <MenuLink
            href="/history"
            title="キャッシュ履歴"
            englishTitle="CASH GAME HISTORY"
            description="過去に保存したキャッシュゲームのハンドを確認・検索します。"
            symbol="♣"
            className="border-sky-700/80 bg-gradient-to-br from-sky-950 via-blue-950 to-slate-950"
          />

          <MenuLink
            href="/review"
            title="AIキャッシュレビュー"
            englishTitle="AI CASH REVIEW"
            description="AIとKB先生がプレイ内容を分析して、改善点をわかりやすく解説します。"
            symbol="♦"
            className="border-yellow-600/80 bg-gradient-to-br from-yellow-950 via-amber-950 to-slate-950"
          />
        </section>

        <section className="mt-6 rounded-3xl border border-emerald-800/60 bg-emerald-950/25 p-5">
          <p className="text-xs font-black tracking-[0.18em] text-emerald-300">
            CASH GAME TIP
          </p>

          <h2 className="mt-2 text-lg font-black">
            同じテーブルなら条件を引き継げます
          </h2>

          <p className="mt-2 text-sm leading-7 text-white/60">
            同じ店舗・ブラインドで続けて記録するときは
            「同条件で新規」を使うと、入力の手間を減らせます。
          </p>
        </section>
      </div>
    </main>
  );
}