"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  calculateVpipStats,
  clearVpipSession,
  loadVpipSession,
  saveVpipSession,
  type VpipAction,
} from "@/lib/vpip-tracker";

function ActionButton({
  label,
  description,
  onClick,
  className,
}: {
  label: string;
  description: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border p-5 text-left shadow-xl transition active:scale-[0.98] ${className}`}
    >
      <span className="block text-xl font-black">{label}</span>
      <span className="mt-1 block text-xs font-bold text-white/50">
        {description}
      </span>
    </button>
  );
}

export default function VpipPage() {
  const [actions, setActions] = useState<VpipAction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setActions(loadVpipSession().actions);
    setLoaded(true);
  }, []);

  const stats = useMemo(() => calculateVpipStats(actions), [actions]);

  function addAction(action: VpipAction) {
    const next = [...actions, action];

    if (!saveVpipSession(next)) {
      setSaveError("記録を保存できませんでした。");
      return;
    }

    setActions(next);
    setSaveError("");
  }

  function undo() {
    if (actions.length === 0) return;

    const next = actions.slice(0, -1);

    if (!saveVpipSession(next)) {
      setSaveError("記録を保存できませんでした。");
      return;
    }

    setActions(next);
    setSaveError("");
  }

  function reset() {
    if (actions.length === 0) return;

    const confirmed = window.confirm(
      "VPIP / PFRの記録をすべてリセットしますか？",
    );

    if (!confirmed) return;

    if (!clearVpipSession()) {
      setSaveError("記録を削除できませんでした。");
      return;
    }

    setActions([]);
    setSaveError("");
  }

  const lastAction = actions.at(-1);

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07150f] text-white">
        <p className="font-black">VPIPデータを読み込んでいます</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-4 pb-[max(40px,env(safe-area-inset-bottom))] pt-[max(24px,calc(env(safe-area-inset-top)+12px))] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-28 top-0 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -left-28 top-1/2 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/60"
          >
            ‹ HOME
          </Link>
          <span className="text-xs font-black tracking-[0.18em] text-emerald-300/70">
            LIVE TRACKER
          </span>
        </div>

        <header className="mt-7">
          <h1 className="text-3xl font-black">📊 VPIP / PFR Tracker</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-white/45">
            毎ハンド終了時に、該当するボタンを1回押すだけです。
          </p>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
            <p className="text-xs font-black text-white/40">ハンド数</p>
            <p className="mt-2 text-4xl font-black">{stats.hands}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
            <p className="text-xs font-black text-white/40">参加数</p>
            <p className="mt-2 text-4xl font-black">{stats.vpipHands}</p>
          </div>
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <p className="text-xs font-black text-emerald-200/65">VPIP</p>
            <p className="mt-2 text-4xl font-black text-emerald-300">
              {stats.hands > 0 ? `${stats.vpip.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
            <p className="text-xs font-black text-amber-200/65">PFR</p>
            <p className="mt-2 text-4xl font-black text-amber-300">
              {stats.hands > 0 ? `${stats.pfr.toFixed(1)}%` : "—"}
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
          <p className="text-xs font-black text-white/35">VPIP / PFR</p>
          <p className="mt-1 text-2xl font-black">
            {stats.hands > 0
              ? `${stats.vpip.toFixed(1)} / ${stats.pfr.toFixed(1)}`
              : "— / —"}
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <ActionButton
            label="⬜ フォールド"
            description="ハンド数 +1 / VPIP・PFRには加算しない"
            onClick={() => addAction("fold")}
            className="border-slate-500/20 bg-gradient-to-br from-slate-800 to-slate-950"
          />
          <ActionButton
            label="🔵 コール参加"
            description="ハンド数 +1 / VPIP +1"
            onClick={() => addAction("call")}
            className="border-sky-500/30 bg-gradient-to-br from-sky-900 to-slate-950"
          />
          <ActionButton
            label="🟢 レイズ参加"
            description="ハンド数 +1 / VPIP +1 / PFR +1"
            onClick={() => addAction("raise")}
            className="border-emerald-500/30 bg-gradient-to-br from-emerald-900 to-slate-950"
          />
        </section>

        {saveError && (
          <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-bold text-red-200">
            {saveError}
          </p>
        )}

        <section className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={undo}
            disabled={actions.length === 0}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 font-black text-white/65 disabled:opacity-30"
          >
            ↩ 1つ戻す
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={actions.length === 0}
            className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-4 py-4 font-black text-red-300 disabled:opacity-30"
          >
            リセット
          </button>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] font-black text-white/35">FOLD</p>
              <p className="mt-1 font-black">{stats.folds}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-300/60">CALL</p>
              <p className="mt-1 font-black">{stats.calls}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-300/60">RAISE</p>
              <p className="mt-1 font-black">{stats.raises}</p>
            </div>
          </div>

          {lastAction && (
            <p className="mt-4 text-center text-xs font-bold text-white/30">
              最後の記録：
              {lastAction === "fold"
                ? "フォールド"
                : lastAction === "call"
                  ? "コール参加"
                  : "レイズ参加"}
            </p>
          )}
        </section>

        <aside className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-4 text-xs font-medium leading-6 text-white/45">
          VPIPはプリフロップで自発的にチップを投入した割合です。
          コール・レイズ・3BET・4BETは参加として数えます。
          BBで追加投資なしにチェックしてフロップを見た場合はVPIPには含めません。
          PFRはプリフロップでレイズした割合です。
        </aside>
      </div>
    </main>
  );
}
