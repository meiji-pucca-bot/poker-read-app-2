"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readReviewCache, REVIEW_UPDATED_EVENT } from "@/lib/hand-review-storage";
import { filterPracticeEntries, reviewTasks, type PracticeEntry, type PracticeFilters, type PracticeHand } from "@/lib/review-practice";

const defaults: PracticeFilters = { mode: "all", maxScore: 100, issue: "", query: "", sort: "scoreLow" };

function handLabel(hand: PracticeHand) {
  const cards = [hand.heroHand?.firstCard, hand.heroHand?.secondCard].map((card) => card?.rank && card?.suit ? `${card.rank}${card.suit}` : "?").join(" ");
  return hand.heroHand?.notation || cards;
}
function dateLabel(value?: string) {
  return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("ja-JP") : "記録なし（旧レビュー）";
}

export default function PracticePage() {
  const [entries, setEntries] = useState<PracticeEntry[]>([]);
  const [filters, setFilters] = useState(defaults);
  const [loaded, setLoaded] = useState(false);
  const [warning, setWarning] = useState("");
  useEffect(() => {
    function refresh() {
      const next: PracticeEntry[] = [];
      const warnings: string[] = [];
      for (const mode of ["cash", "tournament"] as const) {
        try {
          const key = mode === "cash" ? "poker-read-hands" : "poker-read-tournament-hands";
          const hands: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
          if (!Array.isArray(hands)) throw new Error("Invalid hands");
          const { reviews, warning: cacheWarning } = readReviewCache(mode);
          if (cacheWarning) warnings.push(cacheWarning);
          for (const hand of hands) {
            if (hand && typeof hand === "object" && typeof hand.id === "string" && reviews[hand.id]) next.push({ mode, hand, review: reviews[hand.id] });
          }
        } catch { warnings.push("一部の履歴を読み込めませんでした。保存データは変更していません。"); }
      }
      setEntries(next);
      setWarning([...new Set(warnings)].join(" "));
      setLoaded(true);
    }
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener(REVIEW_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener(REVIEW_UPDATED_EVENT, refresh);
    };
  }, []);
  const shown = useMemo(() => filterPracticeEntries(entries, filters), [entries, filters]);
  const issues = useMemo(() => [...new Set(entries.filter((entry) => filters.mode === "all" || entry.mode === filters.mode).map(({ review }) => review.mainLeak).filter((issue) => issue && issue !== "記録なし"))].sort(), [entries, filters.mode]);
  const inputClass = "mt-2 min-h-11 w-full min-w-0 rounded-xl border border-white/20 bg-[#11281d] px-3 py-2 text-sm text-white";
  return (
    <main className="min-h-screen bg-[#07150f] px-4 pb-10 pt-[max(56px,calc(env(safe-area-inset-top)+20px))] text-white">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-flex min-h-11 items-center text-sm font-bold text-emerald-300">← ホームへ戻る</Link>
        <p className="mt-6 text-xs font-bold tracking-widest text-amber-300">REVIEW PRACTICE</p>
        <h1 className="mt-2 text-3xl font-black">苦手なプレーを復習</h1>
        <p className="mt-3 text-sm leading-7 text-white/65">保存済みのAIレビューを、点数が低い順に並べています。課題を絞って、次のプレーに生かしましょう。</p>
        <p className="mt-2 text-xs leading-6 text-white/45">AIの評価は学習の参考です。この一覧を開くだけではAIの再実行や追加料金は発生しません。</p>
        <nav className="my-5 flex flex-wrap gap-3 text-sm font-bold text-emerald-200">
          <Link className="min-h-11 rounded-xl border border-white/15 p-3" href="/history">キャッシュ履歴</Link>
          <Link className="min-h-11 rounded-xl border border-white/15 p-3" href="/tournament/history">大会ハンド履歴</Link>
          <Link className="min-h-11 rounded-xl border border-white/15 p-3" href="/backup">バックアップ</Link>
        </nav>
        {warning && <p role="alert" className="my-4 rounded-xl border border-amber-700 p-4 text-sm text-amber-200">{warning}</p>}
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5" aria-label="復習の絞り込み">
          <div className="grid grid-cols-2 gap-3">
            <label className="min-w-0 text-sm">種別<select aria-label="種別" className={inputClass} value={filters.mode} onChange={(e) => setFilters({ ...filters, mode: e.target.value as PracticeFilters["mode"], issue: "" })}><option value="all">両方</option><option value="cash">キャッシュ</option><option value="tournament">トーナメント</option></select></label>
            <label className="min-w-0 text-sm">点数<select aria-label="点数" className={inputClass} value={filters.maxScore} onChange={(e) => setFilters({ ...filters, maxScore: Number(e.target.value) })}><option value={100}>すべて</option><option value={80}>80点以下</option><option value={60}>60点以下</option><option value={40}>40点以下</option></select></label>
          </div>
          <label className="block text-sm">主な課題<select aria-label="主な課題" className={inputClass} value={filters.issue} onChange={(e) => setFilters({ ...filters, issue: e.target.value })}><option value="">すべての課題</option>{issues.map((issue) => <option key={issue} value={issue}>{issue}</option>)}</select></label>
          <label className="block text-sm">課題のキーワード<input className={inputClass} value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} placeholder="例：ベットサイズ、コール、ICM" /></label>
          <label className="block text-sm">並び順<select aria-label="並び順" className={inputClass} value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value as PracticeFilters["sort"] })}><option value="scoreLow">点数が低い順</option><option value="reviewNewest">レビューが新しい順</option></select></label>
          <div className="flex items-center justify-between gap-3"><p className="text-sm text-white/60">{shown.length} / {entries.length}件</p><button className="min-h-11 rounded-xl px-3 text-sm font-bold text-emerald-300" onClick={() => setFilters(defaults)}>絞り込みを解除</button></div>
        </section>
        {!loaded ? <p className="py-8 text-center text-white/60">読み込み中...</p> : shown.length === 0 ? <p className="py-8 text-center text-sm leading-7 text-white/60">{entries.length === 0 ? "保存済みのAIレビューがまだありません。履歴からハンドをレビューすると、ここに表示されます。" : "条件に合うレビューがありません。絞り込みを変更してください。"}</p> : <div className="mt-5 space-y-4">{shown.map(({ hand, review, mode }) => (
          <article key={`${mode}:${hand.id}`} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-white/45">{mode === "cash" ? "キャッシュ" : "トーナメント"}</p><h2 className="mt-1 break-words text-2xl font-black">{handLabel(hand)}</h2><p className="mt-1 text-sm text-emerald-300">{hand.positions?.heroPosition ?? "位置不明"}</p></div><p className="shrink-0 rounded-xl bg-amber-300 px-3 py-2 text-xl font-black text-amber-950">{review.totalScore}<span className="text-xs">点</span></p></div>
            <p className="mt-3 text-xs text-white/45">レビュー日：{dateLabel(review.reviewedAt)}</p>
            <p className="mt-3 break-words text-sm leading-7 text-white/85">{review.shortSummary || "要約なし"}</p>
            <h3 className="mt-4 text-sm font-bold text-amber-200">AIの課題・次の目標</h3>
            {reviewTasks(review).length ? <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-white/70">{reviewTasks(review).slice(0, 4).map((task) => <li className="break-words" key={task}>{task}</li>)}</ul> : <p className="mt-2 text-sm text-white/45">このレビューには課題が保存されていません。</p>}
            <Link href={`${mode === "cash" ? "/review" : "/tournament/review"}?handId=${encodeURIComponent(hand.id)}`} className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-emerald-400 px-4 py-3 font-bold text-emerald-950">保存済みレビューを開く</Link>
          </article>
        ))}</div>}
      </div>
    </main>
  );
}
