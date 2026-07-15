"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { setPokerMode } from "@/lib/pokerMode";

const tournamentPhases = [
  {
    value: "early",
    label: "序盤",
    description: "スタックが深く、入賞まではまだ遠い",
  },
  {
    value: "middle",
    label: "中盤",
    description: "ブラインドが上がり、スタック差が出始める",
  },
  {
    value: "bubble",
    label: "バブル",
    description: "あと少しで入賞が決まる",
  },
  {
    value: "itm",
    label: "入賞後",
    description: "すでに賞金圏内に入っている",
  },
  {
    value: "final-table",
    label: "ファイナルテーブル",
    description: "最後の1卓で順位賞金を争う",
  },
  {
    value: "heads-up",
    label: "ヘッズアップ",
    description: "残り2人で優勝を争う",
  },
] as const;

type TournamentPhase =
  (typeof tournamentPhases)[number]["value"];

type TournamentSetup = {
  id: string;
  tournamentName: string;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  heroStack: number;
  heroStackBb: number;
  remainingPlayers: number;
  paidPlaces: number;
  currentRank: number | null;
  phase: TournamentPhase;
  considerIcm: boolean;
  createdAt: string;
};

function normalizeNumber(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function formatChips(value: string | number): string {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("ja-JP");
}

export default function TournamentNewHandPage() {
  const router = useRouter();

  const [tournamentName, setTournamentName] = useState("");
  const [smallBlind, setSmallBlind] = useState("");
  const [bigBlind, setBigBlind] = useState("");
  const [ante, setAnte] = useState("");
  const [heroStack, setHeroStack] = useState("");
  const [remainingPlayers, setRemainingPlayers] = useState("");
  const [paidPlaces, setPaidPlaces] = useState("");
  const [currentRank, setCurrentRank] = useState("");
  const [phase, setPhase] =
    useState<TournamentPhase>("early");
  const [considerIcm, setConsiderIcm] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPokerMode("tournament");

    const saved = localStorage.getItem(
      "poker-read-tournament-current",
    );

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(
        saved,
      ) as Partial<TournamentSetup>;

      setTournamentName(parsed.tournamentName ?? "");

      setSmallBlind(
        parsed.smallBlind
          ? String(parsed.smallBlind)
          : "",
      );

      setBigBlind(
        parsed.bigBlind
          ? String(parsed.bigBlind)
          : "",
      );

      setAnte(
        parsed.ante !== undefined
          ? String(parsed.ante)
          : "",
      );

      setHeroStack(
        parsed.heroStack
          ? String(parsed.heroStack)
          : "",
      );

      setRemainingPlayers(
        parsed.remainingPlayers
          ? String(parsed.remainingPlayers)
          : "",
      );

      setPaidPlaces(
        parsed.paidPlaces
          ? String(parsed.paidPlaces)
          : "",
      );

      setCurrentRank(
        parsed.currentRank
          ? String(parsed.currentRank)
          : "",
      );

      if (
        parsed.phase &&
        tournamentPhases.some(
          (item) => item.value === parsed.phase,
        )
      ) {
        setPhase(parsed.phase);
      }

      setConsiderIcm(Boolean(parsed.considerIcm));
    } catch {
      localStorage.removeItem(
        "poker-read-tournament-current",
      );
    }
  }, []);

  const heroStackBb = useMemo(() => {
    const stack = Number(heroStack);
    const bb = Number(bigBlind);

    if (
      !Number.isFinite(stack) ||
      !Number.isFinite(bb) ||
      stack <= 0 ||
      bb <= 0
    ) {
      return null;
    }

    return stack / bb;
  }, [heroStack, bigBlind]);

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
    if (!tournamentName.trim()) {
      setMessage("大会名を入力してください。");
      return false;
    }

    const sb = Number(smallBlind);
    const bb = Number(bigBlind);
    const stack = Number(heroStack);
    const remaining = Number(remainingPlayers);
    const paid = Number(paidPlaces);
    const rank = currentRank
      ? Number(currentRank)
      : null;

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

    if (!stack || stack <= 0) {
      setMessage(
        "自分のスタックをチップ数で入力してください。",
      );
      return false;
    }

    if (!remaining || remaining < 2) {
      setMessage("残り人数を入力してください。");
      return false;
    }

    if (!paid || paid <= 0) {
      setMessage("入賞人数を入力してください。");
      return false;
    }

    if (paid > remaining) {
      setMessage(
        "入賞人数は残り人数以下にしてください。",
      );
      return false;
    }

    if (rank !== null && rank > remaining) {
      setMessage(
        "現在順位は残り人数以下にしてください。",
      );
      return false;
    }

    return true;
  }

  function saveAndContinue() {
    if (!validate()) {
      return;
    }

    const bb = Number(bigBlind);
    const stack = Number(heroStack);

    const existingRaw = localStorage.getItem(
      "poker-read-tournament-current",
    );

    let existingId = "";

    if (existingRaw) {
      try {
        const parsed = JSON.parse(
          existingRaw,
        ) as Partial<TournamentSetup>;

        existingId = parsed.id ?? "";
      } catch {
        existingId = "";
      }
    }

    const setup: TournamentSetup = {
      id: existingId || crypto.randomUUID(),
      tournamentName: tournamentName.trim(),
      smallBlind: Number(smallBlind),
      bigBlind: bb,
      ante: Number(ante || "0"),
      heroStack: stack,
      heroStackBb: Number(
        (stack / bb).toFixed(1),
      ),
      remainingPlayers: Number(
        remainingPlayers,
      ),
      paidPlaces: Number(paidPlaces),
      currentRank: currentRank
        ? Number(currentRank)
        : null,
      phase,
      considerIcm,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "poker-read-tournament-current",
      JSON.stringify(setup),
    );

    setPokerMode("tournament");
    setMessage("");

    router.push("/hero-hand");
  }

  return (
    <main className="min-h-screen bg-[#120b05] px-4 py-7 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link
            href="/new-hand"
            className="text-sm font-bold text-amber-300"
          >
            ← ゲーム選択へ戻る
          </Link>

          <p className="mt-6 text-xs font-black tracking-[0.2em] text-amber-300">
            TOURNAMENT SETUP
          </p>

          <h1 className="mt-2 text-3xl font-black">
            大会情報を入力
          </h1>

          <p className="mt-2 text-sm leading-7 text-white/60">
            入力はすべてチップ数です。
            BB表示は自動で計算されます。
          </p>
        </header>

        <section className="rounded-3xl border border-amber-800/60 bg-gradient-to-br from-amber-950/70 to-black/30 p-5">
          <label
            htmlFor="tournament-name"
            className="font-black"
          >
            大会名
          </label>

          <input
            id="tournament-name"
            value={tournamentName}
            onChange={(event) => {
              setTournamentName(
                event.target.value,
              );
              setMessage("");
            }}
            placeholder="例：Sunday Main Event"
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-4 outline-none focus:border-amber-300"
          />
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-black">
            ブラインド・アンティ
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="tournament-sb"
                className="text-sm font-bold text-white/60"
              >
                SB
              </label>

              <input
                id="tournament-sb"
                inputMode="numeric"
                value={smallBlind}
                onChange={(event) => {
                  setSmallBlind(
                    normalizeNumber(
                      event.target.value,
                    ),
                  );
                  setMessage("");
                }}
                placeholder="500"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-xl font-black outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor="tournament-bb"
                className="text-sm font-bold text-white/60"
              >
                BB
              </label>

              <input
                id="tournament-bb"
                inputMode="numeric"
                value={bigBlind}
                onChange={(event) => {
                  setBigBlind(
                    normalizeNumber(
                      event.target.value,
                    ),
                  );
                  setMessage("");
                }}
                placeholder="1000"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-xl font-black outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="tournament-ante"
              className="text-sm font-bold text-white/60"
            >
              BBアンティ
            </label>

            <input
              id="tournament-ante"
              inputMode="numeric"
              value={ante}
              onChange={(event) => {
                setAnte(
                  normalizeNumber(
                    event.target.value,
                  ),
                );
                setMessage("");
              }}
              placeholder="なしの場合は0"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-xl font-black outline-none focus:border-emerald-400"
            />
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-emerald-800/60 bg-emerald-950/30 p-5">
          <label
            htmlFor="tournament-stack"
            className="font-black"
          >
            自分のスタック
          </label>

          <input
            id="tournament-stack"
            inputMode="numeric"
            value={heroStack}
            onChange={(event) => {
              setHeroStack(
                normalizeNumber(
                  event.target.value,
                ),
              );
              setMessage("");
            }}
            placeholder="例：45000"
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-2xl font-black outline-none focus:border-emerald-400"
          />

          <div className="mt-3 rounded-2xl bg-black/20 p-4">
            <p className="text-sm text-white/50">
              チップ数
            </p>

            <p className="mt-1 text-xl font-black">
              {formatChips(heroStack)} chips
            </p>

            <p className="mt-3 text-sm text-white/50">
              BB換算
            </p>

            <p className="mt-1 text-3xl font-black text-emerald-300">
              {heroStackBb !== null
                ? `${Number(
                    heroStackBb.toFixed(1),
                  )}BB`
                : "—"}
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-black">
            大会の現在状況
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="remaining-players"
                className="text-sm font-bold text-white/60"
              >
                残り人数
              </label>

              <input
                id="remaining-players"
                inputMode="numeric"
                value={remainingPlayers}
                onChange={(event) => {
                  setRemainingPlayers(
                    normalizeNumber(
                      event.target.value,
                    ),
                  );
                  setMessage("");
                }}
                placeholder="120"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-xl font-black outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label
                htmlFor="paid-places"
                className="text-sm font-bold text-white/60"
              >
                入賞人数
              </label>

              <input
                id="paid-places"
                inputMode="numeric"
                value={paidPlaces}
                onChange={(event) => {
                  setPaidPlaces(
                    normalizeNumber(
                      event.target.value,
                    ),
                  );
                  setMessage("");
                }}
                placeholder="100"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-xl font-black outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="current-rank"
              className="text-sm font-bold text-white/60"
            >
              現在順位
              <span className="ml-2 text-xs font-normal text-white/30">
                任意
              </span>
            </label>

            <input
              id="current-rank"
              inputMode="numeric"
              value={currentRank}
              onChange={(event) => {
                setCurrentRank(
                  normalizeNumber(
                    event.target.value,
                  ),
                );
                setMessage("");
              }}
              placeholder="例：35"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-xl font-black outline-none focus:border-sky-400"
            />
          </div>

          {distanceToMoney !== null && (
            <div className="mt-4 rounded-2xl border border-amber-800/60 bg-amber-950/30 p-4">
              <p className="text-sm font-bold text-amber-300">
                入賞までの目安
              </p>

              <p className="mt-1 text-xl font-black">
                {distanceToMoney <= 0
                  ? "すでに入賞圏内"
                  : `あと${distanceToMoney}人の敗退で入賞`}
              </p>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-black">
            トーナメントの段階
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {tournamentPhases.map(
              (item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setPhase(item.value);
                    setMessage("");
                  }}
                  className={`rounded-2xl border p-4 text-left transition active:scale-95 ${
                    phase === item.value
                      ? "border-amber-300 bg-amber-300 text-slate-950"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <span className="block font-black">
                    {item.label}
                  </span>

                  <span className="mt-1 block text-xs leading-5 opacity-70">
                    {item.description}
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-red-900/60 bg-red-950/25 p-5">
          <button
            type="button"
            onClick={() => {
              setConsiderIcm(
                !considerIcm,
              );
              setMessage("");
            }}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="pr-4">
              <p className="font-black text-red-200">
                ICMを考慮する
              </p>

              <p className="mt-1 text-sm leading-6 text-white/50">
                バブル・入賞後・FTでは賞金価値も含めてAIが分析します。
              </p>
            </div>

            <span
              className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${
                considerIcm
                  ? "justify-end bg-amber-300"
                  : "justify-start bg-white/15"
              }`}
            >
              <span className="h-6 w-6 rounded-full bg-white shadow" />
            </span>
          </button>
        </section>

        {message && (
          <p className="mt-4 rounded-2xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={saveAndContinue}
          className="mt-6 w-full rounded-3xl bg-gradient-to-r from-amber-300 to-amber-500 p-5 text-lg font-black text-slate-950 shadow-xl shadow-amber-950/40 active:scale-95"
        >
          保存して自分のハンドへ
        </button>
      </div>
    </main>
  );
}