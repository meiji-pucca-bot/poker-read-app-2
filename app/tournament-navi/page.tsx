"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  finishTournament,
  loadTournament,
  loadTournamentHistory,
  saveTournament,
  type FinishedTournament,
  type SavedTournament,
  type TournamentForm,
} from "@/lib/tournament-storage";

const initialForm: TournamentForm = {
  tournamentName: "",
  buyIn: "",
  startingPlayers: "",
  remainingPlayers: "",
  itmPlayers: "",
  heroStack: "",
  averageStack: "",
  smallBlind: "",
  bigBlind: "",
  ante: "",
  level: "",
};

function toNumber(value: string): number {
  const normalized = value.replace(/,/g, "").trim();
  const number = Number(normalized);

  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 1,
  }).format(value);
}

function InputField({
  label,
  value,
  placeholder,
  inputMode = "numeric",
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  inputMode?: "text" | "numeric" | "decimal";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-200">
        {label}
      </span>

      <input
        type="text"
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/10"
      />
    </label>
  );
}

export default function TournamentNaviPage() {
  const [form, setForm] = useState<TournamentForm>(initialForm);
  const [isStarted, setIsStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [inputMethod, setInputMethod] = useState<
    "manual" | "url" | "photo"
  >("manual");

  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [history, setHistory] = useState<FinishedTournament[]>([]);

  useEffect(() => {
    const savedData = loadTournament();

    if (savedData) {
      setForm({
        ...initialForm,
        ...savedData.form,
      });
      setIsStarted(true);
      setShowResult(true);
      setLastSavedAt(savedData.savedAt);
    }

    setHistory(loadTournamentHistory());
    setIsStorageLoaded(true);
  }, []);


  useEffect(() => {
    if (!isStorageLoaded || !isStarted) {
    return;
  }


    const savedAt = new Date().toISOString();


    const data: SavedTournament = {
    version: 1,
    form,
    isStarted: true,
    savedAt,
  };


    const saved = saveTournament(data);


    if (saved) {
    setLastSavedAt(savedAt);
  }
  }, [form, isStarted, isStorageLoaded]);
  function updateField(
    field: keyof TournamentForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setShowResult(false);
  }

  const calculation = useMemo(() => {
    const heroStack = toNumber(form.heroStack);
    const averageStack = toNumber(form.averageStack);
    const smallBlind = toNumber(form.smallBlind);
    const bigBlind = toNumber(form.bigBlind);
    const ante = toNumber(form.ante);
    const startingPlayers = toNumber(form.startingPlayers);
    const remainingPlayers = toNumber(form.remainingPlayers);
    const itmPlayers = toNumber(form.itmPlayers);

    const heroBb = bigBlind > 0 ? heroStack / bigBlind : 0;
    const averageBb = bigBlind > 0 ? averageStack / bigBlind : 0;

    const orbitCost = smallBlind + bigBlind + ante * 9;
    const mValue = orbitCost > 0 ? heroStack / orbitCost : 0;

    const remainingRate =
      startingPlayers > 0
        ? (remainingPlayers / startingPlayers) * 100
        : 0;

    const bubbleDistance =
      remainingPlayers > 0 && itmPlayers > 0
        ? remainingPlayers - itmPlayers
        : 0;

    let stage = "情報不足";

    if (remainingPlayers > 0 && itmPlayers > 0) {
      if (remainingPlayers <= 9) {
        stage = "ファイナルテーブル";
      } else if (remainingPlayers <= itmPlayers) {
        stage = "インマネ";
      } else if (bubbleDistance <= 3) {
        stage = "バブル";
      } else if (remainingRate <= 25) {
        stage = "終盤";
      } else if (remainingRate <= 60) {
        stage = "中盤";
      } else {
        stage = "序盤";
      }
    } else if (heroBb > 0) {
      stage = "大会進行中";
    }

    let headline = "大会情報を入力してください";
    let advice =
      "スタック、ブラインド、残り人数を入力すると、現在の優先事項を表示します。";
    let rating = 0;
    let mode = "待機中";

    if (heroBb > 0) {
      if (stage === "バブル") {
        headline = "スタック差を見て慎重に戦いましょう";
        advice =
          heroBb >= 25
            ? "十分なスタックがあります。ショートスタックへプレッシャーをかけつつ、大きなスタックとの不要な衝突は避けましょう。"
            : "インマネ目前です。ただし、ただ待つだけではなく、強いハンドや有利なポジションではしっかり参加しましょう。";
        rating = 4;
        mode = "状況に応じて調整";
      } else if (stage === "インマネ") {
        headline = "次の賞金アップを目指してチップを増やしましょう";
        advice =
          "インマネ後はブラインドに削られ続けないことが重要です。CO・BTNなど後ろのポジションから参加機会を探しましょう。";
        rating = 4;
        mode = "チップ獲得";
      } else if (stage === "ファイナルテーブル") {
        headline = "順位とスタック差を強く意識しましょう";
        advice =
          "ファイナルテーブルでは賞金差が大きくなります。自分より短いスタックの人数を確認し、無理なオールインコールを減らしましょう。";
        rating = 5;
        mode = "ICM重視";
      } else if (heroBb <= 10) {
        headline = "次のオールイン機会を逃さないでください";
        advice =
          "10BB以下では通常のレイズ後にフォールドすると大きくスタックを失います。ポジションとハンドを見て、オールインかフォールドを中心に考えましょう。";
        rating = 5;
        mode = "Push / Fold";
      } else if (heroBb <= 15) {
        headline = "レイズフォールドを減らしましょう";
        advice =
          "10〜15BBでは小さくレイズしてから降りると、残りスタックが厳しくなります。強いハンドはオールインも選択肢に入れましょう。";
        rating = 4;
        mode = "ショート戦略";
      } else if (heroBb <= 20) {
        headline = "参加するハンドを慎重に選びましょう";
        advice =
          "20BB前後では大きなポストフロップ勝負が難しくなります。CO・BTNからのスチールと、強いハンドでの3BETオールインを意識しましょう。";
        rating = 4;
        mode = "攻守の切り替え";
      } else if (heroBb <= 40) {
        headline = "CO・BTNからブラインドを狙いましょう";
        advice =
          "扱いやすいスタックです。前のポジションでは慎重に、後ろのポジションではオープン範囲を少し広げましょう。";
        rating = 4;
        mode = "攻め時";
      } else {
        headline = "無理せず有利な場面を増やしましょう";
        advice =
          "十分なスタックがあります。小さなポットを積み重ね、大きなスタック同士の不要なオールイン勝負は避けましょう。";
        rating = 3;
        mode = "安定運用";
      }
    }

    return {
      heroBb,
      averageBb,
      mValue,
      remainingRate,
      bubbleDistance,
      stage,
      headline,
      advice,
      rating,
      mode,
    };
  }, [form]);

  function handleStart() {
  const bigBlind = toNumber(form.bigBlind);
  const heroStack = toNumber(form.heroStack);

  if (bigBlind <= 0 || heroStack <= 0) {
    window.alert(
      "「自分のスタック」と「BB」を入力してください。",
    );
    return;
  }

  const savedAt = new Date().toISOString();

  const data: SavedTournament = {
    version: 1,
    form,
    isStarted: true,
    savedAt,
  };

  const saved = saveTournament(data);

  if (!saved) {
    window.alert(
      "大会データを保存できませんでした。ブラウザの設定を確認してください。",
    );
    return;
  }

  setLastSavedAt(savedAt);
  setIsStarted(true);
  setShowResult(true);
}

  function handleDiagnosis() {
    const bigBlind = toNumber(form.bigBlind);
    const heroStack = toNumber(form.heroStack);

    if (bigBlind <= 0 || heroStack <= 0) {
      window.alert(
        "診断には「自分のスタック」と「BB」が必要です。",
      );
      return;
    }

    setShowResult(true);
  }

 function handleEnd() {
    const confirmed = window.confirm(
      "この大会を終了して履歴に保存しますか？",
    );

    if (!confirmed) {
      return;
    }

    const updatedHistory = finishTournament(form);

    if (!updatedHistory) {
      window.alert(
        "大会履歴を保存できませんでした。ブラウザの設定を確認してください。",
      );
      return;
    }

    setHistory(updatedHistory);
    setIsStarted(false);
    setShowResult(false);
    setLastSavedAt(null);
    setForm(initialForm);
    setInputMethod("manual");
  }
    if (!isStorageLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07150f] px-4 text-white">
        <div className="text-center">
          <div className="text-4xl">🧠</div>

          <p className="mt-4 font-black">
            大会データを確認しています
          </p>

          <p className="mt-2 text-sm text-white/40">
            少しお待ちください
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-4 pb-[max(40px,env(safe-area-inset-bottom))] pt-[max(20px,calc(env(safe-area-inset-top)+12px))] text-white">
      {/* 背景装飾 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -left-32 top-1/2 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md">
        {/* 上部ナビゲーション */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/10"
          >
            ‹ HOME
          </Link>

          {isStarted && (
  <div className="text-right">
    <span className="inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-300">
      ● 進行中
    </span>

    {lastSavedAt && (
      <p className="mt-1 text-[10px] font-bold text-white/35">
        自動保存済み
      </p>
    )}
  </div>
)}
        </div>

        {/* タイトル */}
        <header>
          <p className="text-sm font-black tracking-[0.2em] text-violet-300">
            POKER READ
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            🧠 Tournament Navi
          </h1>

          <p className="mt-3 text-sm font-medium leading-6 text-white/55">
            現在の大会状況から、今優先することを確認できます。
          </p>
        </header>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* 情報取得方法 */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
          <h2 className="text-lg font-black">大会情報の入力方法</h2>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setInputMethod("url")}
              className={`rounded-2xl border px-2 py-3 text-sm font-black transition ${
                inputMethod === "url"
                  ? "border-sky-400/60 bg-sky-400/15 text-sky-200"
                  : "border-white/10 bg-black/20 text-white/55"
              }`}
            >
              🌐
              <span className="mt-1 block">URL</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMethod("photo")}
              className={`rounded-2xl border px-2 py-3 text-sm font-black transition ${
                inputMethod === "photo"
                  ? "border-violet-400/60 bg-violet-400/15 text-violet-200"
                  : "border-white/10 bg-black/20 text-white/55"
              }`}
            >
              📷
              <span className="mt-1 block">写真</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMethod("manual")}
              className={`rounded-2xl border px-2 py-3 text-sm font-black transition ${
                inputMethod === "manual"
                  ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                  : "border-white/10 bg-black/20 text-white/55"
              }`}
            >
              ✍️
              <span className="mt-1 block">手入力</span>
            </button>
          </div>

          {inputMethod === "url" && (
            <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-4">
              <p className="text-sm font-bold text-sky-200">
                URL読込は次の段階で接続します。
              </p>

              <p className="mt-2 text-xs leading-5 text-white/45">
                現在は下のフォームへ手動で入力してください。
              </p>
            </div>
          )}

          {inputMethod === "photo" && (
            <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-400/5 p-4">
              <p className="text-sm font-bold text-violet-200">
                写真読込・OCRは次の段階で接続します。
              </p>

              <p className="mt-2 text-xs leading-5 text-white/45">
                現在は下のフォームへ手動で入力してください。
              </p>
            </div>
          )}

          {inputMethod === "manual" && (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <p className="text-sm font-bold text-emerald-200">
                必要な項目を入力してください。
              </p>
            </div>
          )}
        </section>

        {/* 大会情報 */}
        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
          <h2 className="text-lg font-black">大会情報</h2>

          <div className="mt-5 space-y-4">
            <InputField
              label="大会名"
              value={form.tournamentName}
              placeholder="例：Poker Read Cup"
              inputMode="text"
              onChange={(value) =>
                updateField("tournamentName", value)
              }
            />

            <InputField
              label="バイイン"
              value={form.buyIn}
              placeholder="例：10000"
              onChange={(value) => updateField("buyIn", value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="開始人数"
                value={form.startingPlayers}
                placeholder="例：200"
                onChange={(value) =>
                  updateField("startingPlayers", value)
                }
              />

              <InputField
                label="現在人数"
                value={form.remainingPlayers}
                placeholder="例：80"
                onChange={(value) =>
                  updateField("remainingPlayers", value)
                }
              />
            </div>

            <InputField
              label="インマネ人数"
              value={form.itmPlayers}
              placeholder="例：30"
              onChange={(value) =>
                updateField("itmPlayers", value)
              }
            />
          </div>
        </section>

        {/* 現在の状況 */}
        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
          <h2 className="text-lg font-black">現在の状況</h2>

          <div className="mt-5 space-y-4">
            <InputField
              label="自分のスタック"
              value={form.heroStack}
              placeholder="例：52000"
              onChange={(value) =>
                updateField("heroStack", value)
              }
            />

            <InputField
              label="平均スタック"
              value={form.averageStack}
              placeholder="例：48000"
              onChange={(value) =>
                updateField("averageStack", value)
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="SB"
                value={form.smallBlind}
                placeholder="例：500"
                onChange={(value) =>
                  updateField("smallBlind", value)
                }
              />

              <InputField
                label="BB"
                value={form.bigBlind}
                placeholder="例：1000"
                onChange={(value) =>
                  updateField("bigBlind", value)
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Ante"
                value={form.ante}
                placeholder="例：100"
                onChange={(value) =>
                  updateField("ante", value)
                }
              />

              <InputField
                label="レベル"
                value={form.level}
                placeholder="例：12"
                onChange={(value) =>
                  updateField("level", value)
                }
              />
            </div>
          </div>
        </section>

        {/* 開始・診断ボタン */}
        <div className="mt-5 space-y-3">
          {!isStarted ? (
            <button
              type="button"
              onClick={handleStart}
              className="w-full rounded-3xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500 to-emerald-700 px-5 py-4 text-lg font-black text-white shadow-xl shadow-emerald-950/50 transition hover:brightness-110 active:scale-[0.98]"
            >
              ▶ 開始
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDiagnosis}
              className="w-full rounded-3xl border border-violet-400/40 bg-gradient-to-br from-violet-500 to-violet-800 px-5 py-4 text-lg font-black text-white shadow-xl shadow-violet-950/50 transition hover:brightness-110 active:scale-[0.98]"
            >
              状況を更新して診断
            </button>
          )}
        </div>

        {/* 診断結果 */}
        {showResult && (
          <>
            <section className="mt-6 overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-950 to-slate-950 shadow-2xl">
              <div className="border-b border-white/10 bg-white/[0.04] px-5 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black">🧠 KB先生</h2>

                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-black text-emerald-300">
                    {calculation.mode}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <p className="text-sm font-black tracking-widest text-emerald-300">
                  今やること
                </p>

                <h3 className="mt-3 text-2xl font-black leading-9">
                  {calculation.headline}
                </h3>

                <div className="mt-4 text-xl tracking-wider text-amber-300">
                  {"★".repeat(calculation.rating)}
                  <span className="text-white/15">
                    {"★".repeat(5 - calculation.rating)}
                  </span>
                </div>

                <p className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-medium leading-7 text-slate-200">
                  {calculation.advice}
                </p>
              </div>
            </section>

            {/* 数値結果 */}
            <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
              <h2 className="text-lg font-black">現在のデータ</h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <ResultCard
                  label="自分のスタック"
                  value={`${formatNumber(calculation.heroBb)} BB`}
                />

                <ResultCard
                  label="平均スタック"
                  value={
                    calculation.averageBb > 0
                      ? `${formatNumber(
                          calculation.averageBb,
                        )} BB`
                      : "未入力"
                  }
                />

                <ResultCard
                  label="M値"
                  value={
                    calculation.mValue > 0
                      ? formatNumber(calculation.mValue)
                      : "未計算"
                  }
                />

                <ResultCard
                  label="大会ステージ"
                  value={calculation.stage}
                />

                <ResultCard
                  label="残り人数率"
                  value={
                    calculation.remainingRate > 0
                      ? `${formatNumber(
                          calculation.remainingRate,
                        )}%`
                      : "未計算"
                  }
                />

                <ResultCard
                  label="ITMまで"
                  value={
                    calculation.bubbleDistance > 0
                      ? `あと${calculation.bubbleDistance}人`
                      : calculation.stage === "インマネ" ||
                          calculation.stage ===
                            "ファイナルテーブル"
                        ? "達成"
                        : "未計算"
                  }
                />
              </div>
            </section>
          </>
        )}

        {/* 大会終了 */}
        {isStarted && (
          <button
            type="button"
            onClick={handleEnd}
            className="mt-6 w-full rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4 font-black text-red-300 transition hover:bg-red-400/10"
          >
            ■ 大会を終了する
          </button>
        )}


        {/* 大会履歴 */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black tracking-[0.18em] text-violet-300">
                TOURNAMENT HISTORY
              </p>
              <h2 className="mt-1 text-xl font-black">
                📚 最近の大会
              </h2>
            </div>

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-black text-white/50">
              {history.length}件
            </span>
          </div>

          {history.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-center text-sm font-medium text-white/40">
              終了した大会は、ここに保存されます。
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {history.slice(0, 5).map((tournament) => (
                <article
                  key={tournament.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-black text-white">
                        {tournament.form.tournamentName.trim() ||
                          "名称未入力の大会"}
                      </h3>

                      <p className="mt-1 text-xs font-bold text-white/40">
                        {new Intl.DateTimeFormat("ja-JP", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(
                          new Date(tournament.finishedAt),
                        )}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full border border-slate-400/20 bg-slate-400/10 px-3 py-1 text-xs font-black text-slate-300">
                      終了
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <HistoryValue
                      label="終了時"
                      value={
                        tournament.finalHeroBb > 0
                          ? `${formatNumber(
                              tournament.finalHeroBb,
                            )} BB`
                          : "未計算"
                      }
                    />
                    <HistoryValue
                      label="残り人数"
                      value={
                        tournament.form.remainingPlayers ||
                        "未入力"
                      }
                    />
                    <HistoryValue
                      label="レベル"
                      value={tournament.form.level || "未入力"}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-white/30">
          診断内容は大会状況を整理するための参考情報です。
          <br />
          最終判断はテーブル状況も含めて行ってください。
        </p>
      </div>
    </main>
  );
}

function HistoryValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <p className="text-[10px] font-bold text-white/35">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-white/80">
        {value}
      </p>
    </div>
  );
}

function ResultCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold text-white/40">{label}</p>
      <p className="mt-2 break-words text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

