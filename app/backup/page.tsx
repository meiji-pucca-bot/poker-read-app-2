"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { applyRestore, createBackup, hasPendingRecovery, planRestore, recoverPendingRestore } from "@/lib/hand-history-backup";
import { REVIEW_UPDATED_EVENT } from "@/lib/hand-review-storage";

type RestorePlan = ReturnType<typeof planRestore>;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

function message(error: unknown) { return error instanceof Error ? error.message : "処理できませんでした。保存データを確認してください。"; }

export default function BackupPage() {
  const [plan, setPlan] = useState<RestorePlan | null>(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [pendingRecovery, setPendingRecovery] = useState(false);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const selection = useRef(0);
  const applying = useRef(false);

  useEffect(() => {
    // Browser storage is only available after hydration; reflect its recovery state once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setPendingRecovery(hasPendingRecovery()); }
    catch (caught) { setError(message(caught)); }
    setReady(true);
  }, []);

  function exportBackup() {
    setError("");
    try {
      const backup = createBackup();
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `poker-read-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setNotice("バックアップの保存を開始しました。「ダウンロード」や「ファイル」アプリでJSONファイルが保存されたことを確認してください。");
    } catch (caught) { setError(message(caught)); }
  }

  async function selectFile(file?: File) {
    const request = ++selection.current;
    setPlan(null); setBackupConfirmed(false); setError(""); setNotice(""); setFilename("");
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error("20MB以下のバックアップファイルを選んでください。");
      const json = await file.text();
      if (selection.current !== request) return;
      const next = planRestore(json);
      setPlan(next);
      setFilename(file.name);
    } catch (caught) { if (selection.current === request) setError(message(caught)); }
    finally { if (selection.current === request) setBusy(false); }
  }

  function cancel() {
    ++selection.current;
    setPlan(null); setFilename(""); setBackupConfirmed(false); setError(""); setBusy(false);
    if (fileInput.current) fileInput.current.value = "";
    setNotice("取り込みをキャンセルしました。保存データは変更していません。");
  }

  function restore() {
    if (!plan || !backupConfirmed || applying.current) return;
    if (!window.confirm("確認したバックアップを取り込みますか？現在のハンドは削除せずに追加・統合します。他のPoker Readのタブは閉じてから実行してください。")) return;
    applying.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const stats = applyRestore(plan);
      setPlan(null); setFilename(""); setBackupConfirmed(false);
      if (fileInput.current) fileInput.current.value = "";
      window.dispatchEvent(new Event(REVIEW_UPDATED_EVENT));
      setNotice(`取り込みが完了しました。ハンド ${stats.handsAdded}件、レビュー ${stats.reviewsAdded}件、お気に入り ${stats.favoritesAdded}件を追加しました。履歴から確認できます。`);
    } catch (caught) {
      setError(message(caught));
      setPlan(null); setBackupConfirmed(false);
      if (fileInput.current) fileInput.current.value = "";
    } finally {
      try { setPendingRecovery(hasPendingRecovery()); } catch { setPendingRecovery(true); }
      applying.current = false; setBusy(false);
    }
  }

  function recover() {
    if (applying.current || !window.confirm("中断した取り込みを元に戻しますか？取り込み後に別のタブで保存した内容がある場合は保護のため停止します。先に現在のバックアップを保存してください。")) return;
    applying.current = true; setBusy(true); setError("");
    try {
      recoverPendingRestore();
      setPendingRecovery(false);
      window.dispatchEvent(new Event(REVIEW_UPDATED_EVENT));
      setNotice("中断した取り込み前の状態に戻しました。バックアップファイルを選び直すと再試行できます。");
    } catch (caught) { setError(message(caught)); }
    finally { applying.current = false; setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[#07150f] px-4 pb-10 pt-[max(56px,calc(env(safe-area-inset-top)+20px))] text-white">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-flex min-h-11 items-center text-sm font-bold text-emerald-300">← ホームへ戻る</Link>
        <p className="mt-6 text-xs font-bold tracking-widest text-sky-300">HISTORY BACKUP</p>
        <h1 className="mt-2 text-3xl font-black">バックアップ・復元</h1>
        <p className="mt-3 text-sm leading-7 text-white/65">キャッシュ・トーナメントのハンド、保存済みAIレビュー、お気に入りをまとめてJSONファイルに保存できます。</p>
        <p className="mt-2 text-xs leading-6 text-white/45">この操作ではデータをサーバーへ送りません。大会成績・Tournament Navi・VPIPセッション・入力途中のデータは対象外です。ファイルにはメモも含まれるため、安全な場所に保管してください。</p>
        <nav className="my-5 flex gap-3 text-sm font-bold text-emerald-200"><Link className="min-h-11 rounded-xl border border-white/15 p-3" href="/history">キャッシュ履歴</Link><Link className="min-h-11 rounded-xl border border-white/15 p-3" href="/tournament/history">大会ハンド履歴</Link></nav>
        {error && <p role="alert" className="my-4 break-words rounded-xl border border-red-700 bg-red-950/30 p-4 text-sm leading-7 text-red-200">{error}</p>}
        {notice && <p role="status" className="my-4 rounded-xl border border-emerald-700 bg-emerald-950/30 p-4 text-sm leading-7 text-emerald-200">{notice}</p>}
        <section className="rounded-3xl border border-sky-900 bg-sky-950/20 p-5">
          <h2 className="text-lg font-black">1. 現在の履歴を保存</h2>
          <p className="mt-3 text-sm leading-7 text-white/65">機種変更の前や、復元の前に保存してください。元のブラウザで保存し、移行先で同じファイルを読み込みます。</p>
          <button disabled={!ready || busy} onClick={exportBackup} className="mt-4 min-h-12 w-full rounded-xl bg-sky-300 px-4 py-3 font-bold text-sky-950 disabled:opacity-40">バックアップを保存</button>
        </section>
        {pendingRecovery && <section className="mt-5 rounded-3xl border border-amber-700 bg-amber-950/30 p-5"><h2 className="font-black text-amber-200">中断した取り込みがあります</h2><p className="mt-3 text-sm leading-7 text-white/70">新しい取り込みの前に、元の状態へ戻してください。安全のため他のタブを閉じ、現在のバックアップも保存してください。</p><button disabled={busy} className="mt-4 min-h-12 w-full rounded-xl bg-amber-300 px-3 py-3 font-bold text-amber-950 disabled:opacity-40" onClick={recover}>中断した取り込みを元に戻す</button></section>}
        <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-black">2. バックアップを取り込む</h2>
          <p className="mt-3 text-sm leading-7 text-white/65">ファイルを選ぶだけでは変更されません。既存データは残し、同じ内容は重複させません。同じIDでもハンドやレビューの内容が違う場合は、別ハンドとして保全します。</p>
          <p className="mt-2 text-xs leading-6 text-amber-200/80">復元中は他のPoker Readのタブを閉じてください。複数タブの同時更新を完全には防げません。</p>
          <label className="mt-4 block text-sm font-bold" htmlFor="backup-file">Poker ReadのJSONファイル</label>
          <input id="backup-file" ref={fileInput} type="file" accept=".json,application/json" disabled={!ready || busy || pendingRecovery} onChange={(e) => void selectFile(e.target.files?.[0])} className="mt-2 w-full min-w-0 rounded-xl border border-white/20 p-3 text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-300 file:p-2 file:text-emerald-950 disabled:opacity-40" />
          {busy && <p role="status" className="mt-3 text-sm text-white/60">処理中...</p>}
          {plan && <div className="mt-5 border-t border-white/10 pt-5">
            <h3 className="font-black">取り込み内容の確認</h3>
            <p className="mt-2 break-all text-xs text-white/50">{filename}</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80"><li>追加ハンド：{plan.stats.handsAdded}件</li><li>追加レビュー：{plan.stats.reviewsAdded}件</li><li>追加お気に入り：{plan.stats.favoritesAdded}件</li><li>内容の違いを別ハンドとして保全：{plan.stats.conflictCopies}件</li></ul>
            {plan.stats.skippedReviewConflicts > 0 && <p className="mt-3 text-sm leading-7 text-amber-200">対応するハンドがない競合レビュー {plan.stats.skippedReviewConflicts}件は取り込めません。現在のレビューを残します。読み込んだJSONファイルは保管してください。</p>}
            <label className="mt-4 flex min-h-12 items-start gap-3 rounded-xl border border-white/15 p-3 text-sm leading-6"><input type="checkbox" checked={backupConfirmed} onChange={(e) => setBackupConfirmed(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" />現在のバックアップファイルが保存されたことを確認しました</label>
            <div className="mt-4 grid grid-cols-2 gap-3"><button onClick={cancel} disabled={busy} className="min-h-12 rounded-xl border border-white/20 px-3 py-3 text-sm font-bold">キャンセル</button><button onClick={restore} disabled={!backupConfirmed || busy} className="min-h-12 rounded-xl bg-emerald-300 px-3 py-3 text-sm font-black text-emerald-950 disabled:opacity-35">この内容で取り込む</button></div>
          </div>}
        </section>
      </div>
    </main>
  );
}
