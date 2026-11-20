import { useEffect, useState } from "react";
import type { AiReview, ReviewTextEdits, StreetKey, StreetTextEdits } from "@/lib/hand-review-storage";

const overview = [
  ["shortSummary", "レビューのまとめ", false],
  ["strongestStreet", "一番良かったストリート", false],
  ["mainLeak", "一番の改善点", false],
  ["goodPoints", "良かった点", true],
  ["improvementPoints", "改善点", true],
  ["nextGoals", "次の目標", true],
  ["finalMessage", "レビューの最後のコメント", false],
] as const;
const streetFields = [
  ["verdict", "判定コメント", false],
  ["heroAction", "自分のアクション（レビューの記述）", false],
  ["recommendedAction", "おすすめのアクション", false],
  ["goodPoints", "良かった点", true],
  ["improvementPoints", "改善点", true],
  ["detail", "詳しい解説", false],
] as const;
const streetLabels: Record<StreetKey, string> = {
  preflop: "プリフロップ", flop: "フロップ", turn: "ターン", river: "リバー",
};

const asText = (value: string | string[]) => typeof value === "string" ? value : value.join("\n");
const asList = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

export function HandReviewEditor({ review, onSave, onClose }: {
  review: AiReview;
  onSave: (base: AiReview, edits: ReviewTextEdits) => void;
  onClose: () => void;
}) {
  const [base] = useState(review);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const dirty = Object.keys(draft).length > 0;

  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = true;
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function field(key: string, label: string, original: string, list: boolean) {
    return (
      <label key={key} className="block text-sm font-bold text-white/85">
        {label}{list && <span className="ml-2 text-xs font-normal text-white/55">1行に1項目</span>}
        <textarea rows={2} value={draft[key] ?? original} onChange={(event) => {
          const value = event.target.value;
          setDraft((current) => {
            const next = { ...current, [key]: value };
            if (value === original) delete next[key];
            return next;
          });
          setError("");
        }} className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950 px-3 py-2 text-base font-normal text-white focus:border-emerald-300 focus:outline-none" />
      </label>
    );
  }

  function submit() {
    const edits: ReviewTextEdits = {};
    for (const [key, , list] of overview) {
      const value = draft[key];
      if (value !== undefined) Object.assign(edits, { [key]: list ? asList(value) : value });
    }
    const streets: NonNullable<ReviewTextEdits["streets"]> = {};
    for (const street of Object.keys(streetLabels) as StreetKey[]) {
      const changes: StreetTextEdits = {};
      for (const [key, , list] of streetFields) {
        const value = draft[`${street}.${key}`];
        if (value !== undefined) Object.assign(changes, { [key]: list ? asList(value) : value });
      }
      if (Object.keys(changes).length) streets[street] = changes;
    }
    if (Object.keys(streets).length) edits.streets = streets;
    try {
      onSave(base, edits);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error && caught.message.startsWith("保存済みレビューが変わりました")
        ? caught.message
        : "このブラウザに保存できませんでした。入力は残っています。");
    }
  }

  return (
    <section aria-label="保存済みレビューを編集" className="mt-4 space-y-4 rounded-3xl border border-emerald-700 bg-emerald-950/30 p-4">
      <h2 className="font-black text-emerald-200">保存済みレビューを編集</h2>
      <p className="text-sm text-white/65">レビューの文章だけを変更します。採点と元のハンド履歴は変わりません。AIの再生成も行いません。</p>
      {overview.map(([key, label, list]) => field(key, label, asText(base[key]), list))}
      {(Object.entries(streetLabels) as [StreetKey, string][]).map(([street, label]) => (
        <details key={street} className="rounded-xl border border-white/15 p-3">
          <summary className="cursor-pointer py-2 text-sm font-bold">{label}のレビュー</summary>
          <div className="mt-3 space-y-3">
            {streetFields.map(([key, title, list]) => field(`${street}.${key}`, title, asText(base.streets[street][key]), list))}
          </div>
        </details>
      ))}
      {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-white/25 px-2 text-sm font-bold">キャンセル</button>
        <button type="button" onClick={submit} disabled={!dirty} className="min-h-12 rounded-xl bg-emerald-300 px-2 text-sm font-black text-slate-950 disabled:opacity-50">変更を保存</button>
      </div>
    </section>
  );
}
