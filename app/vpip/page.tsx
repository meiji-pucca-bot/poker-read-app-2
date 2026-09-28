"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {stats,totals,loadActions,saveActions,clearActions,loadHistory,saveHistory,type VpipAction,type SavedSession} from "@/lib/vpip-tracker";

const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const parse=(v:string)=>{if(!v.trim())return null;const n=Number(v.replace(/,/g,""));return Number.isFinite(n)?n:null};
const money=(n:number)=>`${n>0?"+":""}${new Intl.NumberFormat("ja-JP").format(n)}`;

export default function VpipPage(){
 const [actions,setActions]=useState<VpipAction[]>([]);
 const [history,setHistory]=useState<SavedSession[]>([]);
 const [date,setDate]=useState(today());
 const [start,setStart]=useState(""),[end,setEnd]=useState(""),[direct,setDirect]=useState("");
 const [ready,setReady]=useState(false),[error,setError]=useState("");
 useEffect(()=>{setActions(loadActions());setHistory(loadHistory());setReady(true)},[]);
 const s=useMemo(()=>stats(actions),[actions]),t=useMemo(()=>totals(history),[history]);
 const profit=useMemo(()=>{const d=parse(direct);if(d!==null)return d;const a=parse(start),b=parse(end);return a!==null&&b!==null?b-a:null},[start,end,direct]);
 const add=(a:VpipAction)=>{const n=[...actions,a];if(saveActions(n)){setActions(n);setError("")}else setError("保存できませんでした。")};
 const undo=()=>{const n=actions.slice(0,-1);if(saveActions(n))setActions(n)};
 function save(){
  if(!s.hands)return setError("ハンドを1件以上記録してください。");
  if(profit===null)return setError("開始額と終了額、または収支を入力してください。");
  if(!window.confirm(`${date} のセッションを保存しますか？\n${s.hands} hands\nVPIP ${s.vpip.toFixed(1)} / PFR ${s.pfr.toFixed(1)}\n収支 ${money(profit)}`))return;
  const item:SavedSession={id:crypto.randomUUID?.()??String(Date.now()),date,hands:s.hands,folds:s.folds,calls:s.calls,raises:s.raises,vpipHands:s.vpipHands,vpip:s.vpip,pfr:s.pfr,startAmount:parse(start),endAmount:parse(end),profit,savedAt:new Date().toISOString()};
  const n=[item,...history];if(!saveHistory(n))return setError("保存できませんでした。");
  clearActions();setHistory(n);setActions([]);setDate(today());setStart("");setEnd("");setDirect("");setError("");
 }
 function remove(id:string){if(!confirm("この履歴を削除しますか？"))return;const n=history.filter(x=>x.id!==id);if(saveHistory(n))setHistory(n)}
 if(!ready)return <main className="min-h-screen bg-[#07150f] p-8 text-white">読み込み中...</main>;
 return <main className="min-h-screen bg-[#07150f] px-4 pb-16 pt-6 text-white"><div className="mx-auto max-w-md">
 <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black">‹ HOME</Link>
 <header className="mt-7"><p className="text-xs font-black tracking-widest text-emerald-300">SESSION TRACKER</p><h1 className="mt-2 text-3xl font-black">📊 VPIP / PFR</h1><p className="mt-2 text-sm text-white/45">毎ハンド1回タップ。終了時に日付と収支を保存します。</p></header>
 <section className="mt-6 grid grid-cols-2 gap-3">
 {([["ハンド数",s.hands,""],["参加数",s.vpipHands,""],["VPIP",s.hands?s.vpip.toFixed(1)+"%":"—","text-emerald-300"],["PFR",s.hands?s.pfr.toFixed(1)+"%":"—","text-amber-300"]] as const).map(([l,v,c])=><div key={l} className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-white/40">{l}</p><p className={`mt-2 text-4xl font-black ${c}`}>{v}</p></div>)}
 </section>
 <section className="mt-6 space-y-3">
 <button onClick={()=>add("fold")} className="w-full rounded-3xl bg-slate-900 p-5 text-left"><b className="text-xl">⬜ フォールド</b><span className="block text-xs text-white/45">ハンド数 +1</span></button>
 <button onClick={()=>add("call")} className="w-full rounded-3xl bg-sky-950 p-5 text-left"><b className="text-xl">🔵 コール参加</b><span className="block text-xs text-white/45">ハンド数 +1 / VPIP +1</span></button>
 <button onClick={()=>add("raise")} className="w-full rounded-3xl bg-emerald-950 p-5 text-left"><b className="text-xl">🟢 レイズ参加</b><span className="block text-xs text-white/45">ハンド数 +1 / VPIP +1 / PFR +1</span></button>
 <button onClick={undo} disabled={!actions.length} className="w-full rounded-2xl border border-white/10 p-4 font-black disabled:opacity-30">↩ 1つ戻す</button>
 </section>

 <section className="mt-7 rounded-3xl border border-amber-400/20 bg-amber-400/5 p-5">
 <h2 className="text-xl font-black">💰 セッション終了</h2>
 <label className="mt-4 block"><span className="mb-2 block text-sm font-black">日付</span><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></label>
 <div className="mt-4 grid grid-cols-2 gap-3">
 <label><span className="mb-2 block text-xs">開始額</span><input inputMode="numeric" value={start} onChange={e=>setStart(e.target.value)} placeholder="50000" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></label>
 <label><span className="mb-2 block text-xs">終了額</span><input inputMode="numeric" value={end} onChange={e=>setEnd(e.target.value)} placeholder="63500" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></label>
 </div>
 <p className="my-4 text-center text-xs text-white/30">または</p>
 <label><span className="mb-2 block text-sm font-black">収支を直接入力</span><input inputMode="numeric" value={direct} onChange={e=>setDirect(e.target.value)} placeholder="+13500 / -8000" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></label>
 <div className="mt-4 rounded-2xl bg-black/25 p-4 text-center"><p className="text-xs text-white/35">今回の収支</p><p className={`mt-1 text-3xl font-black ${profit===null?"text-white/35":profit>=0?"text-emerald-300":"text-rose-300"}`}>{profit===null?"—":money(profit)}</p></div>
 <button onClick={save} className="mt-4 w-full rounded-2xl bg-amber-400 p-4 font-black text-amber-950">セッションを保存</button>
 </section>
 {error&&<p className="mt-4 rounded-2xl bg-red-400/10 p-4 text-sm font-bold text-red-200">{error}</p>}
 <section className="mt-7 rounded-3xl border border-cyan-400/15 bg-cyan-400/5 p-5">
 <h2 className="text-xl font-black">📈 累計成績</h2>
 <div className="mt-4 grid grid-cols-2 gap-3">
 {([["セッション",t.sessions],["総ハンド数",t.hands],["VPIP",t.hands?t.vpip.toFixed(1)+"%":"—"],["PFR",t.hands?t.pfr.toFixed(1)+"%":"—"]] as const).map(([l,v])=><div key={l} className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-white/35">{l}</p><p className="mt-1 text-2xl font-black">{v}</p></div>)}
 </div>
 <div className="mt-3 rounded-2xl bg-black/20 p-4 text-center"><p className="text-xs text-white/35">総収支</p><p className={`mt-1 text-3xl font-black ${t.profit>=0?"text-emerald-300":"text-rose-300"}`}>{money(t.profit)}</p></div>
 </section>
 <section className="mt-7"><h2 className="text-xl font-black">📚 セッション履歴</h2>
 {history.length===0?<p className="mt-4 rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-white/35">保存済みセッションはありません。</p>:<div className="mt-4 space-y-3">{history.map(x=><article key={x.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{x.date}</p><p className="mt-1 text-xs text-white/40">{x.hands} hands · VPIP {x.vpip.toFixed(1)} / PFR {x.pfr.toFixed(1)}</p></div><p className={`font-black ${x.profit>=0?"text-emerald-300":"text-rose-300"}`}>{money(x.profit)}</p></div><div className="mt-3 flex justify-between text-xs text-white/35"><span>F {x.folds} / C {x.calls} / R {x.raises}</span><button onClick={()=>remove(x.id)} className="font-black text-red-300">削除</button></div></article>)}</div>}
 </section>
 </div></main>;
}
