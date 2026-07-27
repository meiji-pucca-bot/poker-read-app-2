"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ALL_CARDS,
  type Card,
  calculateEquity,
  cardLabel,
  drawOdds,
  handName,
  potOdds,
} from "@/lib/poker-calculator";

type Tab = "pot" | "draw" | "equity";

function NumberField({
  label, value, onChange, min = 0, step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-white/75">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-bold outline-none transition focus:border-emerald-400/60"
      />
    </label>
  );
}

function CardSelect({
  label, value, onChange, disabled,
}: {
  label: string;
  value: Card | "";
  onChange: (value: Card | "") => void;
  disabled: Card[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-white/55">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Card | "")}
        className="w-full rounded-xl border border-white/10 bg-[#0b1913] px-3 py-3 font-black outline-none focus:border-emerald-400/60"
      >
        <option value="">未選択</option>
        {ALL_CARDS.map((card) => (
          <option key={card} value={card} disabled={disabled.includes(card) && card !== value}>
            {cardLabel(card)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CalculatorPage() {
  const [tab, setTab] = useState<Tab>("pot");
  const [pot, setPot] = useState(10000);
  const [bet, setBet] = useState(5000);
  const [call, setCall] = useState(5000);
  const [knownEquity, setKnownEquity] = useState(0);

  const [outs, setOuts] = useState(9);
  const [cardsToCome, setCardsToCome] = useState<1 | 2>(1);

  const [hero, setHero] = useState<(Card | "")[]>(["", ""]);
  const [villain, setVillain] = useState<(Card | "")[]>(["", ""]);
  const [board, setBoard] = useState<(Card | "")[]>(["", "", "", "", ""]);
  const [trials, setTrials] = useState(10000);
  const [result, setResult] = useState<ReturnType<typeof calculateEquity> | null>(null);
  const [error, setError] = useState("");
  const [calculating, setCalculating] = useState(false);

  const potResult = useMemo(() => potOdds(pot, bet, call), [pot, bet, call]);
  const drawResult = useMemo(() => drawOdds(outs, cardsToCome), [outs, cardsToCome]);

  const usedCards = [...hero, ...villain, ...board].filter(Boolean) as Card[];

  function setAt<T>(items: T[], index: number, value: T): T[] {
    return items.map((item, i) => (i === index ? value : item));
  }

  function runEquity() {
    setError("");
    setResult(null);
    setCalculating(true);
    window.setTimeout(() => {
      try {
        const heroCards = hero.filter(Boolean) as Card[];
        const villainCards = villain.filter(Boolean) as Card[];
        const boardCards = board.filter(Boolean) as Card[];
        setResult(calculateEquity(heroCards, villainCards, boardCards, trials));
      } catch (err) {
        setError(err instanceof Error ? err.message : "計算に失敗しました。");
      } finally {
        setCalculating(false);
      }
    }, 20);
  }

  return (
    <main className="min-h-screen bg-[#07150f] px-4 pb-16 pt-[max(24px,env(safe-area-inset-top))] text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black">
            ← HOME
          </Link>
          <span className="text-xs font-black tracking-[0.2em] text-emerald-300/70">POKER CALCULATOR</span>
        </div>

        <header className="mt-8">
          <h1 className="text-3xl font-black">🧮 オッズ・エクイティ計算</h1>
          <p className="mt-2 text-sm leading-6 text-white/50">
            ポットオッズ、ドロー完成率、ハンドの勝率をブラウザ内で計算します。
          </p>
        </header>

        <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
          {([
            ["pot", "ポットオッズ"],
            ["draw", "ドロー"],
            ["equity", "エクイティ"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-xl px-2 py-3 text-xs font-black transition ${
                tab === key ? "bg-emerald-500 text-emerald-950" : "text-white/45 hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "pot" && (
          <section className="mt-6 rounded-3xl border border-emerald-400/20 bg-white/[0.04] p-5">
            <h2 className="text-xl font-black">ポットオッズ計算</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">
              コール額を、コール後の最終ポットで割って必要勝率を求めます。
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <NumberField label="現在のポット" value={pot} onChange={setPot} />
              <NumberField label="相手のベット" value={bet} onChange={setBet} />
              <NumberField label="自分のコール額" value={call} onChange={setCall} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-black/25 p-4">
                <p className="text-xs font-black text-white/40">コール後の最終ポット</p>
                <p className="mt-1 text-2xl font-black">{potResult.finalPot.toLocaleString("ja-JP")}</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-xs font-black text-emerald-200/70">必要エクイティ</p>
                <p className="mt-1 text-3xl font-black text-emerald-300">{potResult.requiredEquity.toFixed(1)}%</p>
              </div>
            </div>
            <div className="mt-5">
              <NumberField label="自分の推定エクイティ（任意）" value={knownEquity} onChange={setKnownEquity} step={0.1} />
              {knownEquity > 0 && (
                <div className={`mt-3 rounded-2xl p-4 font-black ${
                  knownEquity >= potResult.requiredEquity
                    ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : "border border-rose-400/20 bg-rose-400/10 text-rose-300"
                }`}>
                  {knownEquity >= potResult.requiredEquity ? "コール候補" : "フォールド候補"}
                  <span className="ml-2 text-sm opacity-70">
                    差 {knownEquity - potResult.requiredEquity >= 0 ? "+" : ""}
                    {(knownEquity - potResult.requiredEquity).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "draw" && (
          <section className="mt-6 rounded-3xl border border-sky-400/20 bg-white/[0.04] p-5">
            <h2 className="text-xl font-black">ドローオッズ計算</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">
              アウトは、引けば勝ちにつながる可能性が高い残りカードです。
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <NumberField label="アウト数" value={outs} onChange={setOuts} min={0} />
              <label className="block">
                <span className="mb-2 block text-sm font-black text-white/75">残りカード</span>
                <select
                  value={cardsToCome}
                  onChange={(event) => setCardsToCome(Number(event.target.value) as 1 | 2)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1913] px-4 py-3 font-bold"
                >
                  <option value={1}>次の1枚だけ</option>
                  <option value={2}>ターン＋リバー</option>
                </select>
              </label>
            </div>
            <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-5 text-center">
              <p className="text-xs font-black text-sky-200/70">完成確率</p>
              <p className="mt-1 text-4xl font-black text-sky-300">{drawResult.toFixed(1)}%</p>
              <p className="mt-2 text-xs text-white/35">
                目安：次の1枚はアウト数×2、2枚見るならアウト数×4
              </p>
            </div>
          </section>
        )}

        {tab === "equity" && (
          <section className="mt-6 rounded-3xl border border-violet-400/20 bg-white/[0.04] p-5">
            <h2 className="text-xl font-black">ハンドエクイティ計算</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">
              相手のカードを空欄にすると、ランダムな2枚に対して計算します。
            </p>

            <div className="mt-5">
              <h3 className="text-sm font-black text-emerald-300">Hero</h3>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {hero.map((card, index) => (
                  <CardSelect key={index} label={`カード${index + 1}`} value={card}
                    onChange={(value) => setHero(setAt(hero, index, value))} disabled={usedCards} />
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-black text-rose-300">相手</h3>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {villain.map((card, index) => (
                  <CardSelect key={index} label={`カード${index + 1}`} value={card}
                    onChange={(value) => setVillain(setAt(villain, index, value))} disabled={usedCards} />
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-black text-sky-300">ボード</h3>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {board.map((card, index) => (
                  <CardSelect key={index}
                    label={["Flop 1", "Flop 2", "Flop 3", "Turn", "River"][index]}
                    value={card}
                    onChange={(value) => setBoard(setAt(board, index, value))}
                    disabled={usedCards}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-white/75">試行回数</span>
                <select
                  value={trials}
                  onChange={(event) => setTrials(Number(event.target.value))}
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1913] px-4 py-3 font-bold"
                >
                  <option value={3000}>3,000（高速）</option>
                  <option value={10000}>10,000（標準）</option>
                  <option value={30000}>30,000（高精度）</option>
                </select>
              </label>
              <button
                type="button"
                onClick={runEquity}
                disabled={calculating}
                className="rounded-2xl bg-emerald-500 px-6 py-3 font-black text-emerald-950 transition hover:brightness-110 disabled:opacity-50"
              >
                {calculating ? "計算中..." : "エクイティを計算"}
              </button>
            </div>

            {error && <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm font-bold text-rose-300">{error}</p>}

            {result && (
              <div className="mt-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-center">
                    <p className="text-xs font-black text-emerald-200/70">Hero Equity</p>
                    <p className="mt-1 text-3xl font-black text-emerald-300">{result.equity.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-center">
                    <p className="text-xs font-black text-rose-200/70">Opponent</p>
                    <p className="mt-1 text-3xl font-black text-rose-300">{result.opponentEquity.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-2xl bg-black/25 p-4 text-center">
                    <p className="text-xs font-black text-white/40">引き分け</p>
                    <p className="mt-1 text-3xl font-black">{result.tieRate.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-black/20 p-4 text-sm leading-6 text-white/45">
                  勝ち {result.wins.toLocaleString()}回 / 負け {result.losses.toLocaleString()}回 /
                  引き分け {result.ties.toLocaleString()}回
                  {hero.filter(Boolean).length === 2 && board.filter(Boolean).length >= 3 && (
                    <span className="block mt-1">
                      現在のHeroの役：{handName([...(hero.filter(Boolean) as Card[]), ...(board.filter(Boolean) as Card[])])}
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        <aside className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-4 text-xs leading-5 text-amber-100/55">
          計算結果はチップEVの目安です。トーナメントのICM、レーキ、相手の実際のレンジ、
          将来のベットは含みません。実戦ではスタック量と相手の傾向も合わせて判断してください。
        </aside>
      </div>
    </main>
  );
}
