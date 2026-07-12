"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PositionKey =
  | "UTG"
  | "MP"
  | "HJ"
  | "CO"
  | "BTN"
  | "SB"
  | "BB";

type PositionInfo = {
  key: PositionKey;
  japanese: string;
  shortDescription: string;
  beginnerTip: string;
};

const positions: PositionInfo[] = [
  {
    key: "UTG",
    japanese: "アンダー・ザ・ガン",
    shortDescription: "最初に行動するポジション",
    beginnerTip:
      "後ろに多くのプレイヤーが残っているため、強めのハンドを中心に参加します。",
  },
  {
    key: "MP",
    japanese: "ミドルポジション",
    shortDescription: "テーブルの中央付近",
    beginnerTip:
      "UTGより少し広く参加できますが、まだ慎重な判断が必要です。",
  },
  {
    key: "HJ",
    japanese: "ハイジャック",
    shortDescription: "後ろ寄りのポジション",
    beginnerTip:
      "後ろの人数が少ないため、参加できるハンドが少し増えます。",
  },
  {
    key: "CO",
    japanese: "カットオフ",
    shortDescription: "BTNの1つ前",
    beginnerTip:
      "かなり有利な位置です。ブラインドを狙って広めに参加できます。",
  },
  {
    key: "BTN",
    japanese: "ボタン",
    shortDescription: "最後に行動しやすいポジション",
    beginnerTip:
      "最も有利なポジションです。相手の行動を見てから判断しやすくなります。",
  },
  {
    key: "SB",
    japanese: "スモールブラインド",
    shortDescription: "小さいブラインドを支払う位置",
    beginnerTip:
      "フロップ以降は先に行動しやすく、不利になりやすいポジションです。",
  },
  {
    key: "BB",
    japanese: "ビッグブラインド",
    shortDescription: "大きいブラインドを支払う位置",
    beginnerTip:
      "すでに1BBを支払っているため、相手のレイズにコールしやすい場面があります。",
  },
];

type SavedPositions = {
  heroPosition: PositionKey | "";
  villainPosition: PositionKey | "";
};

const emptyPositions: SavedPositions = {
  heroPosition: "",
  villainPosition: "",
};

export default function PositionsPage() {
  const [selected, setSelected] =
    useState<SavedPositions>(emptyPositions);

  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(
      "poker-read-positions-draft",
    );

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as SavedPositions;
      setSelected(parsed);
    } catch {
      localStorage.removeItem(
        "poker-read-positions-draft",
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "poker-read-positions-draft",
      JSON.stringify(selected),
    );
  }, [selected]);

  const heroInfo = positions.find(
    (position) =>
      position.key === selected.heroPosition,
  );

  const villainInfo = positions.find(
    (position) =>
      position.key === selected.villainPosition,
  );

  const isComplete =
    Boolean(selected.heroPosition) &&
    Boolean(selected.villainPosition) &&
    selected.heroPosition !== selected.villainPosition;

  function chooseHero(position: PositionKey) {
    setSelected((current) => ({
      ...current,
      heroPosition: position,
    }));

    setMessage("");
  }

  function chooseVillain(position: PositionKey) {
    setSelected((current) => ({
      ...current,
      villainPosition: position,
    }));

    setMessage("");
  }

  function clearPositions() {
    setSelected(emptyPositions);
    localStorage.removeItem(
      "poker-read-positions-draft",
    );
    setMessage("ポジションをクリアしました。");
  }

  function savePositions() {
    if (!selected.heroPosition) {
      setMessage(
        "自分のポジションを選んでください。",
      );
      return false;
    }

    if (!selected.villainPosition) {
      setMessage(
        "相手のポジションを選んでください。",
      );
      return false;
    }

    if (
      selected.heroPosition ===
      selected.villainPosition
    ) {
      setMessage(
        "自分と相手に同じポジションは選べません。",
      );
      return false;
    }

    localStorage.setItem(
      "poker-read-positions",
      JSON.stringify(selected),
    );

    setMessage(
      "ポジションを保存しました。",
    );

    return true;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link
            href="/hero-hand"
            className="mb-5 inline-block text-sm font-semibold text-slate-400"
          >
            ← 前の画面へ戻る
          </Link>

          <p className="mb-2 text-sm font-bold text-emerald-400">
            STEP 3 / ポジション
          </p>

          <h1 className="text-3xl font-bold">
            ポジションを選ぶ
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            自分と相手が、テーブルのどの位置にいたかを選んでください。
          </p>
        </header>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-3/5 rounded-full bg-emerald-500" />
        </div>

        <section className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4">
            <p className="text-sm font-bold text-emerald-400">
              自分（Hero）
            </p>

            <h2 className="mt-1 text-xl font-bold">
              自分のポジション
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              あなたが座っていた位置です。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {positions.map((position) => (
              <button
                key={position.key}
                type="button"
                onClick={() =>
                  chooseHero(position.key)
                }
                className={`rounded-2xl border p-4 text-left transition active:scale-95 ${
                  selected.heroPosition ===
                  position.key
                    ? "border-emerald-500 bg-emerald-500 text-slate-950"
                    : "border-slate-700 bg-slate-950"
                }`}
              >
                <span className="block text-xl font-bold">
                  {position.key}
                </span>

                <span className="mt-1 block text-xs">
                  {position.shortDescription}
                </span>
              </button>
            ))}
          </div>

          {heroInfo && (
            <div className="mt-4 rounded-xl border border-emerald-900 bg-emerald-950/40 p-4">
              <p className="font-bold text-emerald-300">
                {heroInfo.key}（
                {heroInfo.japanese}）
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {heroInfo.beginnerTip}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4">
            <p className="text-sm font-bold text-sky-400">
              相手（Villain）
            </p>

            <h2 className="mt-1 text-xl font-bold">
              相手のポジション
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              今回読みたい相手の位置です。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {positions.map((position) => (
              <button
                key={position.key}
                type="button"
                onClick={() =>
                  chooseVillain(position.key)
                }
                disabled={
                  selected.heroPosition ===
                  position.key
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  selected.heroPosition ===
                  position.key
                    ? "cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600"
                    : selected.villainPosition ===
                        position.key
                      ? "border-sky-400 bg-sky-500 text-slate-950 active:scale-95"
                      : "border-slate-700 bg-slate-950 active:scale-95"
                }`}
              >
                <span className="block text-xl font-bold">
                  {position.key}
                </span>

                <span className="mt-1 block text-xs">
                  {position.shortDescription}
                </span>
              </button>
            ))}
          </div>

          {villainInfo && (
            <div className="mt-4 rounded-xl border border-sky-900 bg-sky-950/40 p-4">
              <p className="font-bold text-sky-300">
                {villainInfo.key}（
                {villainInfo.japanese}）
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {villainInfo.beginnerTip}
              </p>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            現在の選択
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-xs text-emerald-400">
                自分
              </p>

              <p className="mt-1 text-2xl font-bold">
                {selected.heroPosition ||
                  "未選択"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-xs text-sky-400">
                相手
              </p>

              <p className="mt-1 text-2xl font-bold">
                {selected.villainPosition ||
                  "未選択"}
              </p>
            </div>
          </div>
        </section>

        {message && (
          <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <Link
            href={
              isComplete ? "/preflop" : "#"
            }
            onClick={(event) => {
              if (!savePositions()) {
                event.preventDefault();
              }
            }}
            className={`block w-full rounded-2xl p-5 text-center text-lg font-bold transition ${
              isComplete
                ? "bg-emerald-500 text-slate-950 active:scale-95"
                : "cursor-not-allowed bg-slate-800 text-slate-500"
            }`}
          >
            保存して次へ
          </Link>

          <button
            type="button"
            onClick={clearPositions}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 font-bold text-slate-300"
          >
            選択をクリア
          </button>
        </div>
      </div>
    </main>
  );
}