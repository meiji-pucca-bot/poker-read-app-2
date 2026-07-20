"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CURRENT_KEY = "poker-read-tournament-current";
const DRAFT_KEY = "poker-read-tournament-setup-draft";
const SAME_CONDITION_KEY = "poker-read-tournament-same-condition";

type TournamentHand = {
  id?: string;
  result?: {
    type?: "win" | "lose" | "chop";
  };
};

type SavedTournamentCondition = {
  tournamentName?: string;
  startingPlayers?: string | number;
  remainingPlayers?: string | number;
  paidPlaces?: string | number;
  registrationStatus?: "open" | "closed";
  averageStack?: string | number | null;
  smallBlind?: string | number;
  bigBlind?: string | number;
  ante?: string | number;
  considerIcm?: boolean;
  prizeStructure?: "standard" | "winner-take-all" | "unknown";
};

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readTournamentHands(): TournamentHand[] {
  const saved = localStorage.getItem("poker-read-tournament-hands");

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type MenuButtonProps = {
  title: string;
  englishTitle: string;
  description: string;
  symbol: string;
  className: string;
  onClick: () => void;
  disabled?: boolean;
};

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
        className={`relative overflow-hidden rounded-3xl border p-5 ${className} ${
          disabled ? "" : "active:scale-[0.98]"
        }`}
      >
        <span className="absolute -right-3 -top-8 text-[110px] font-black opacity-10">
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

            <h2 className="mt-1 text-2xl font-black">{title}</h2>

            <p className="mt-2 text-sm leading-6 text-white/65">
              {description}
            </p>
          </div>

          <span className="text-2xl text-white/40">›</span>
        </div>
      </div>
    </button>
  );
}

type MenuLinkProps = {
  href: string;
  title: string;
  englishTitle: string;
  description: string;
  symbol: string;
  className: string;
};

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
        className={`relative overflow-hidden rounded-3xl border p-5 active:scale-[0.98] ${className}`}
      >
        <span className="absolute -right-3 -top-8 text-[110px] font-black opacity-10">
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

            <h2 className="mt-1 text-2xl font-black">{title}</h2>

            <p className="mt-2 text-sm leading-6 text-white/65">
              {description}
            </p>
          </div>

          <span className="text-2xl text-white/40">›</span>
        </div>
      </div>
    </Link>
  );
}

export default function TournamentHomePage() {
  const router = useRouter();
  const [handCount, setHandCount] = useState(0);
  const [winCount, setWinCount] = useState(0);
  const [hasReusableCondition, setHasReusableCondition] = useState(false);

  useEffect(() => {
    const hands = readTournamentHands();

    setHandCount(hands.length);
    setWinCount(
      hands.filter((hand) => hand.result?.type === "win").length,
    );

    const draft = safeParse<SavedTournamentCondition>(
      localStorage.getItem(DRAFT_KEY),
    );
    const current = safeParse<SavedTournamentCondition>(
      localStorage.getItem(CURRENT_KEY),
    );
    const source = draft ?? current;

    setHasReusableCondition(
      Boolean(
        source &&
          (source.tournamentName ||
            source.startingPlayers ||
            source.remainingPlayers ||
            source.paidPlaces ||
            source.smallBlind ||
            source.bigBlind),
      ),
    );
  }, []);

  function startCompletelyNewHand() {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(CURRENT_KEY);
    localStorage.removeItem(SAME_CONDITION_KEY);

    router.push("/tournament/new-hand?start=new");
  }

  function startWithSameCondition() {
    const draft = safeParse<SavedTournamentCondition>(
      localStorage.getItem(DRAFT_KEY),
    );
    const current = safeParse<SavedTournamentCondition>(
      localStorage.getItem(CURRENT_KEY),
    );
    const source = draft ?? current;

    if (!source) return;

    const reusableCondition: SavedTournamentCondition = {
      tournamentName: source.tournamentName ?? "",
      startingPlayers: source.startingPlayers ?? "",
      remainingPlayers: source.remainingPlayers ?? "",
      paidPlaces: source.paidPlaces ?? "",
      registrationStatus: source.registrationStatus ?? "open",
      averageStack: source.averageStack ?? "",
      smallBlind: source.smallBlind ?? "",
      bigBlind: source.bigBlind ?? "",
      ante: source.ante ?? "",
      considerIcm: Boolean(source.considerIcm),
      prizeStructure: source.prizeStructure ?? "standard",
    };

    localStorage.setItem(
      SAME_CONDITION_KEY,
      JSON.stringify(reusableCondition),
    );

    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(CURRENT_KEY);

    router.push("/tournament/new-hand?start=same");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120b05] px-4 pb-7 pt-[max(56px,calc(env(safe-area-inset-top)+20px))] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-150px] h-[330px] w-[330px] -translate-x-1/2 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -left-24 top-1/3 h-60 w-60 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute -right-24 bottom-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md">
        <header className="mb-7">
          <Link href="/" className="relative z-20 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-bold text-amber-300 active:bg-white/10">
            ← 戻る
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-dashed border-amber-200 bg-gradient-to-br from-amber-300 to-amber-600 text-4xl shadow-xl shadow-amber-950/50">
              🏆
            </div>

            <div>
              <p className="text-xs font-black tracking-[0.2em] text-amber-300">
                TOURNAMENT MODE
              </p>
              <h1 className="mt-1 text-3xl font-black">トーナメント</h1>
              <p className="mt-1 text-sm text-white/50">
                ICM・バブル・スタックを考慮
              </p>
            </div>
          </div>
        </header>

        <section className="mb-5 rounded-3xl border border-amber-700/60 bg-gradient-to-br from-amber-950/80 to-black/40 p-5 shadow-xl">
          <p className="text-xs font-black text-amber-300">
            TOURNAMENT STATUS
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/25 p-4">
              <p className="text-xs text-white/40">保存ハンド</p>
              <p className="mt-1 text-3xl font-black">{handCount}</p>
            </div>

            <div className="rounded-2xl bg-black/25 p-4">
              <p className="text-xs text-white/40">勝ち</p>
              <p className="mt-1 text-3xl font-black text-emerald-300">
                {winCount}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <MenuButton
            title="新規ハンド"
            englishTitle="NEW TOURNAMENT HAND"
            description="前回の入力を消して、完全に新しい大会情報から記録します。"
            symbol="♠"
            className="border-emerald-800 bg-gradient-to-br from-emerald-900 to-emerald-950"
            onClick={startCompletelyNewHand}
          />

          <MenuButton
            title="同条件で新規"
            englishTitle="NEW WITH SAME CONDITIONS"
            description={
              hasReusableCondition
                ? "大会情報とブラインドだけを引き継ぎ、新しいハンドを記録します。"
                : "引き継げる大会情報がまだありません。"
            }
            symbol="♥"
            className="border-fuchsia-900 bg-gradient-to-br from-fuchsia-950 to-slate-950"
            onClick={startWithSameCondition}
            disabled={!hasReusableCondition}
          />

          <MenuLink
            href="/tournament/history"
            title="トーナメント履歴"
            englishTitle="TOURNAMENT HISTORY"
            description="トーナメント専用の保存ハンドを確認します。"
            symbol="♣"
            className="border-sky-900 bg-gradient-to-br from-sky-950 to-slate-950"
          />

          <MenuLink
            href="/tournament/review"
            title="AIトーナメントレビュー"
            englishTitle="TOURNAMENT AI REVIEW"
            description="ICMやスタック状況を含めてAIコーチが分析します。"
            symbol="♦"
            className="border-amber-800 bg-gradient-to-br from-amber-950 to-slate-950"
          />
        </section>

        <section className="mt-6 rounded-3xl border border-red-900/60 bg-red-950/20 p-5">
          <p className="text-xs font-black tracking-[0.18em] text-red-300">
            INPUT RULE
          </p>
          <h2 className="mt-2 text-lg font-black">
            新規と同条件を使い分け
          </h2>
          <p className="mt-2 text-sm leading-7 text-white/60">
            「新規ハンド」は全消去、「同条件で新規」は大会情報とブラインドだけを引き継ぎます。
            戻る操作では入力途中の下書きが残ります。
          </p>
        </section>
      </div>

      
    </main>
  );
}
