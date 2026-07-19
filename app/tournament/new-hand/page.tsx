"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { setPokerMode } from "@/lib/pokerMode";

type RegistrationStatus = "open" | "closed";
type PrizeStructure = "standard" | "winner-take-all" | "unknown";
type TournamentPhase =
  | "registration"
  | "early"
  | "middle"
  | "bubble"
  | "itm"
  | "final-table"
  | "heads-up";

type TournamentSetup = {
  id: string;
  tournamentName: string;
  startingPlayers: number;
  remainingPlayers: number;
  paidPlaces: number;
  registrationStatus: RegistrationStatus;
  averageStack: number | null;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  heroStack: number;
  heroStackBb: number;
  currentRank: number | null;
  phase: TournamentPhase;
  considerIcm: boolean;
  prizeStructure: PrizeStructure;
  createdAt: string;
  updatedAt: string;
};

type TournamentDraft = {
  tournamentName: string;
  startingPlayers: string;
  remainingPlayers: string;
  paidPlaces: string;
  registrationStatus: RegistrationStatus;
  averageStack: string;
  smallBlind: string;
  bigBlind: string;
  ante: string;
  heroStack: string;
  currentRank: string;
  considerIcm: boolean;
  prizeStructure: PrizeStructure;
};

const CURRENT_KEY = "poker-read-tournament-current";
const DRAFT_KEY = "poker-read-tournament-setup-draft";
const SAME_CONDITION_KEY = "poker-read-tournament-same-condition";

const phaseLabels: Record<TournamentPhase, string> = {
  registration: "レイトレジスト中",
  early: "序盤",
  middle: "中盤",
  bubble: "バブル",
  itm: "インマネ",
  "final-table": "ファイナルテーブル",
  "heads-up": "ヘッズアップ",
};

function normalizeNumber(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function formatChips(value: string | number): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return number.toLocaleString("ja-JP");
}

function detectTournamentPhase({
  startingPlayers,
  remainingPlayers,
  paidPlaces,
  registrationStatus,
}: {
  startingPlayers: number;
  remainingPlayers: number;
  paidPlaces: number;
  registrationStatus: RegistrationStatus;
}): TournamentPhase {
  if (registrationStatus === "open") return "registration";
  if (remainingPlayers <= 2) return "heads-up";
  if (remainingPlayers <= 9) return "final-table";
  if (paidPlaces > 0 && remainingPlayers <= paidPlaces) return "itm";
  if (
    paidPlaces > 0 &&
    remainingPlayers <= Math.ceil(paidPlaces * 1.15)
  ) {
    return "bubble";
  }

  if (startingPlayers > 0) {
    const remainingRate = remainingPlayers / startingPlayers;
    if (remainingRate >= 0.7) return "early";
  }

  return "middle";
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export default function TournamentNewHandPage() {
  const router = useRouter();

  const [tournamentName, setTournamentName] = useState("");
  const [startingPlayers, setStartingPlayers] = useState("");
  const [remainingPlayers, setRemainingPlayers] = useState("");
  const [paidPlaces, setPaidPlaces] = useState("");
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus>("open");
  const [averageStack, setAverageStack] = useState("");
  const [smallBlind, setSmallBlind] = useState("");
  const [bigBlind, setBigBlind] = useState("");
  const [ante, setAnte] = useState("");
  const [heroStack, setHeroStack] = useState("");
  const [currentRank, setCurrentRank] = useState("");
  const [considerIcm, setConsiderIcm] = useState(false);
  const [prizeStructure, setPrizeStructure] =
    useState<PrizeStructure>("standard");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPokerMode("tournament");

    const params = new URLSearchParams(window.location.search);
    const startMode = params.get("start");

    let saved: Partial<TournamentDraft> | Partial<TournamentSetup> | null = null;

    if (startMode === "new") {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(CURRENT_KEY);
      localStorage.removeItem(SAME_CONDITION_KEY);
    } else if (startMode === "same") {
      saved = safeParse<Partial<TournamentDraft>>(
        localStorage.getItem(SAME_CONDITION_KEY),
      );

      localStorage.removeItem(SAME_CONDITION_KEY);
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(CURRENT_KEY);
    } else {
      const draft = safeParse<Partial<TournamentDraft>>(
        localStorage.getItem(DRAFT_KEY),
      );
      const current = safeParse<Partial<TournamentSetup>>(
        localStorage.getItem(CURRENT_KEY),
      );

      saved = draft ?? current;
    }

    if (saved) {
      setTournamentName(saved.tournamentName ?? "");
      setStartingPlayers(
        saved.startingPlayers !== undefined
          ? String(saved.startingPlayers)
          : "",
      );
      setRemainingPlayers(
        saved.remainingPlayers !== undefined
          ? String(saved.remainingPlayers)
          : "",
      );
      setPaidPlaces(
        saved.paidPlaces !== undefined ? String(saved.paidPlaces) : "",
      );
      setRegistrationStatus(saved.registrationStatus ?? "open");
      setAverageStack(
        saved.averageStack !== undefined && saved.averageStack !== null
          ? String(saved.averageStack)
          : "",
      );
      setSmallBlind(
        saved.smallBlind !== undefined ? String(saved.smallBlind) : "",
      );
      setBigBlind(
        saved.bigBlind !== undefined ? String(saved.bigBlind) : "",
      );
      setAnte(saved.ante !== undefined ? String(saved.ante) : "");
      setConsiderIcm(Boolean(saved.considerIcm));
      setPrizeStructure(saved.prizeStructure ?? "standard");

      // 同条件で新規の場合、ハンドごとに変化する情報は引き継がない
      if (startMode !== "same") {
        setHeroStack(
          saved.heroStack !== undefined ? String(saved.heroStack) : "",
        );
        setCurrentRank(
          saved.currentRank !== undefined && saved.currentRank !== null
            ? String(saved.currentRank)
            : "",
        );
      }
    }

    setLoaded(true);

    if (startMode) {
      window.history.replaceState(
        {},
        "",
        window.location.pathname,
      );
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const draft: TournamentDraft = {
      tournamentName,
      startingPlayers,
      remainingPlayers,
      paidPlaces,
      registrationStatus,
      averageStack,
      smallBlind,
      bigBlind,
      ante,
      heroStack,
      currentRank,
      considerIcm,
      prizeStructure,
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    tournamentName,
    startingPlayers,
    remainingPlayers,
    paidPlaces,
    registrationStatus,
    averageStack,
    smallBlind,
    bigBlind,
    ante,
    heroStack,
    currentRank,
    considerIcm,
    prizeStructure,
    loaded,
  ]);

  const heroStackBb = useMemo(() => {
    const stack = Number(heroStack);
    const bb = Number(bigBlind);
    if (!Number.isFinite(stack) || !Number.isFinite(bb) || stack <= 0 || bb <= 0) {
      return null;
    }
    return stack / bb;
  }, [heroStack, bigBlind]);

  const phase = useMemo(
    () =>
      detectTournamentPhase({
        startingPlayers: Number(startingPlayers),
        remainingPlayers: Number(remainingPlayers),
        paidPlaces: Number(paidPlaces),
        registrationStatus,
      }),
    [startingPlayers, remainingPlayers, paidPlaces, registrationStatus],
  );

  const distanceToMoney = useMemo(() => {
    const remaining = Number(remainingPlayers);
    const paid = Number(paidPlaces);
    if (
      !Number.isFinite(remaining) ||
      !Number.isFinite(paid) ||
      remaining <= 0 ||
      paid <= 0
    ) {
      return null;
    }
    return remaining - paid;
  }, [remainingPlayers, paidPlaces]);

  function validate(): boolean {
    const start = Number(startingPlayers);
    const remaining = Number(remainingPlayers);
    const paid = Number(paidPlaces);
    const sb = Number(smallBlind);
    const bb = Number(bigBlind);
    const bbAnte = Number(ante || "0");
    const stack = Number(heroStack);
    const average = averageStack ? Number(averageStack) : null;
    const rank = currentRank ? Number(currentRank) : null;

    if (!start || start < 2) {
      setMessage("開始参加人数を入力してください。");
      return false;
    }
    if (!remaining || remaining < 2) {
      setMessage("現在の残り人数を入力してください。");
      return false;
    }
    if (remaining > start) {
      setMessage("残り人数は開始参加人数以下にしてください。");
      return false;
    }
    if (!paid || paid <= 0) {
      setMessage("入賞人数を入力してください。");
      return false;
    }
    // 入賞後は「残り人数 < 入賞人数」が正常なので、ここでは弾きません。
    if (paid > start) {
      setMessage("入賞人数は開始参加人数以下にしてください。");
      return false;
    }
    if (!sb || sb <= 0) {
      setMessage("SBを入力してください。");
      return false;
    }
    if (!bb || bb <= 0) {
      setMessage("BBを入力してください。");
      return false;
    }
    if (sb >= bb) {
      setMessage("SBはBBより小さくしてください。");
      return false;
    }
    if (!Number.isFinite(bbAnte) || bbAnte < 0) {
      setMessage("BBアンティは0以上で入力してください。");
      return false;
    }
    if (!stack || stack <= 0) {
      setMessage("自分のスタックを入力してください。");
      return false;
    }
    if (stack < bb + bbAnte) {
      setMessage("HeroスタックはBBとBBアンティの合計以上にしてください。");
      return false;
    }
    if (average !== null && (!Number.isFinite(average) || average <= 0)) {
      setMessage("平均スタックは空欄、または1以上で入力してください。");
      return false;
    }
    if (rank !== null && (!Number.isFinite(rank) || rank < 1 || rank > remaining)) {
      setMessage("現在順位は1以上、残り人数以下にしてください。");
      return false;
    }

    return true;
  }

  function saveAndContinue() {
    if (!validate()) return;

    const existing = safeParse<Partial<TournamentSetup>>(
      localStorage.getItem(CURRENT_KEY),
    );
    const now = new Date().toISOString();
    const bb = Number(bigBlind);
    const stack = Number(heroStack);

    const setup: TournamentSetup = {
      id: existing?.id || crypto.randomUUID(),
      tournamentName: tournamentName.trim(),
      startingPlayers: Number(startingPlayers),
      remainingPlayers: Number(remainingPlayers),
      paidPlaces: Number(paidPlaces),
      registrationStatus,
      averageStack: averageStack ? Number(averageStack) : null,
      smallBlind: Number(smallBlind),
      bigBlind: bb,
      ante: Number(ante || "0"),
      heroStack: stack,
      heroStackBb: Number((stack / bb).toFixed(1)),
      currentRank: currentRank ? Number(currentRank) : null,
      phase,
      considerIcm,
      prizeStructure,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    localStorage.setItem(CURRENT_KEY, JSON.stringify(setup));
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      tournamentName,
      startingPlayers,
      remainingPlayers,
      paidPlaces,
      registrationStatus,
      averageStack,
      smallBlind,
      bigBlind,
      ante,
      heroStack,
      currentRank,
      considerIcm,
      prizeStructure,
    } satisfies TournamentDraft));

    setPokerMode("tournament");
    setMessage("");
    router.push("/hero-hand");
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#120b05] px-6 pb-6 pt-[max(56px,calc(env(safe-area-inset-top)+20px))] text-white">
        読み込み中...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#120b05] px-4 pb-7 pt-[max(56px,calc(env(safe-area-inset-top)+20px))] text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link href="/tournament" className="relative z-20 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-bold text-amber-300 active:bg-white/10">
            ← トーナメントモードへ戻る
          </Link>
          <p className="mt-6 text-xs font-black tracking-[0.2em] text-amber-300">
            TOURNAMENT SETUP
          </p>
          <h1 className="mt-2 text-3xl font-black">大会情報を入力</h1>
          <p className="mt-2 text-sm leading-7 text-white/60">
            入力内容は自動保存されます。戻る操作をしても復元されます。
          </p>
        </header>

        <section className="rounded-3xl border border-amber-800/60 bg-gradient-to-br from-amber-950/70 to-black/30 p-5">
          <label htmlFor="tournament-name" className="font-black">
            大会名
            <span className="ml-2 text-xs font-normal text-white/40">任意</span>
          </label>
          <input
            id="tournament-name"
            value={tournamentName}
            onChange={(event) => {
              setTournamentName(event.target.value);
              setMessage("");
            }}
            placeholder="例：Sunday Main Event"
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-4 outline-none focus:border-amber-300"
          />
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-black">大会の現在状況</h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <NumberField
              id="starting-players"
              label="開始参加人数"
              value={startingPlayers}
              placeholder="500"
              onChange={(value) => {
                setStartingPlayers(value);
                setMessage("");
              }}
            />
            <NumberField
              id="remaining-players"
              label="残り人数"
              value={remainingPlayers}
              placeholder="120"
              onChange={(value) => {
                setRemainingPlayers(value);
                setMessage("");
              }}
            />
            <NumberField
              id="paid-places"
              label="入賞人数"
              value={paidPlaces}
              placeholder="75"
              onChange={(value) => {
                setPaidPlaces(value);
                setMessage("");
              }}
            />
            <NumberField
              id="current-rank"
              label="現在順位（任意）"
              value={currentRank}
              placeholder="35"
              onChange={(value) => {
                setCurrentRank(value);
                setMessage("");
              }}
            />
          </div>

          <div className="mt-4">
            <p className="text-sm font-bold text-white/60">レイトレジスト</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {([
                ["open", "レジスト中"],
                ["closed", "レジスト終了"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRegistrationStatus(value);
                    setMessage("");
                  }}
                  className={`rounded-2xl border p-4 font-black transition active:scale-95 ${
                    registrationStatus === value
                      ? "border-amber-300 bg-amber-300 text-slate-950"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <NumberField
              id="average-stack"
              label="平均スタック（任意）"
              value={averageStack}
              placeholder="35000"
              onChange={(value) => {
                setAverageStack(value);
                setMessage("");
              }}
            />
          </div>

          {distanceToMoney !== null && (
            <div className="mt-4 rounded-2xl border border-amber-800/60 bg-amber-950/30 p-4">
              <p className="relative z-20 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-bold text-amber-300 active:bg-white/10">入賞状況</p>
              <p className="mt-1 text-xl font-black">
                {distanceToMoney <= 0
                  ? "すでに入賞圏内"
                  : `あと${distanceToMoney}人の敗退で入賞`}
              </p>
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-sky-800/60 bg-sky-950/30 p-4">
            <p className="text-sm font-bold text-sky-300">大会段階（自動判定）</p>
            <p className="mt-1 text-2xl font-black">{phaseLabels[phase]}</p>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-black">ブラインド・BBアンティ</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <NumberField
              id="tournament-sb"
              label="SB"
              value={smallBlind}
              placeholder="500"
              onChange={(value) => {
                setSmallBlind(value);
                setMessage("");
              }}
            />
            <NumberField
              id="tournament-bb"
              label="BB"
              value={bigBlind}
              placeholder="1000"
              onChange={(value) => {
                setBigBlind(value);
                setMessage("");
              }}
            />
          </div>
          <div className="mt-4">
            <NumberField
              id="tournament-ante"
              label="BBアンティ"
              value={ante}
              placeholder="1000（なしは0）"
              onChange={(value) => {
                setAnte(value);
                setMessage("");
              }}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-white/45">
            BBアンティは開始ポットへ加算し、BBプレイヤーのスタックから差し引きます。コール額には含めません。
          </p>
        </section>

        <section className="mt-4 rounded-3xl border border-emerald-800/60 bg-emerald-950/30 p-5">
          <NumberField
            id="tournament-stack"
            label="自分のスタック"
            value={heroStack}
            placeholder="45000"
            onChange={(value) => {
              setHeroStack(value);
              setMessage("");
            }}
          />
          <div className="mt-3 rounded-2xl bg-black/20 p-4">
            <p className="text-sm text-white/50">チップ数</p>
            <p className="mt-1 text-xl font-black">{formatChips(heroStack)} chips</p>
            <p className="mt-3 text-sm text-white/50">BB換算</p>
            <p className="mt-1 text-3xl font-black text-emerald-300">
              {heroStackBb !== null ? `${Number(heroStackBb.toFixed(1))}BB` : "—"}
            </p>
            {averageStack && Number(bigBlind) > 0 && (
              <p className="mt-3 text-sm text-white/60">
                平均：{Number((Number(averageStack) / Number(bigBlind)).toFixed(1))}BB
              </p>
            )}
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-black">賞金・ICM</h2>
          <label className="mt-4 block text-sm font-bold text-white/60">
            賞金構造
          </label>
          <select
            value={prizeStructure}
            onChange={(event) => {
              setPrizeStructure(event.target.value as PrizeStructure);
              setMessage("");
            }}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-4 outline-none"
          >
            <option value="standard">通常（順位ごと）</option>
            <option value="winner-take-all">勝者総取り</option>
            <option value="unknown">不明</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setConsiderIcm((current) => !current);
              setMessage("");
            }}
            className={`mt-4 flex w-full items-center justify-between rounded-2xl border p-4 text-left ${
              considerIcm
                ? "border-red-300 bg-red-300 text-slate-950"
                : "border-red-900/60 bg-red-950/25"
            }`}
          >
            <div>
              <p className="font-black">ICMを考慮する</p>
              <p className="mt-1 text-xs opacity-70">
                バブル・入賞後・FTなどで賞金価値も分析します。
              </p>
            </div>
            <span className="text-xl font-black">{considerIcm ? "ON" : "OFF"}</span>
          </button>
        </section>

        {message && (
          <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-950/50 p-4 text-sm font-bold text-red-200">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={saveAndContinue}
          className="mt-6 w-full rounded-2xl bg-amber-300 px-5 py-4 text-lg font-black text-slate-950 transition active:scale-95"
        >
          Heroハンド入力へ進む
        </button>
      </div>
    </main>
  );
}

function NumberField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-white/60">
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(normalizeNumber(event.target.value))}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-xl font-black outline-none focus:border-amber-300"
      />
    </div>
  );
}
