"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const positionOptions = [
  {
    key: "UTG",
    reading: "アンダー・ザ・ガン",
    shortDescription: "プリフロップで最初に行動",
    description:
      "最初に行動するため、強いハンドを中心に参加するポジションです。",
  },
  {
    key: "UTG+1",
    reading: "アンダー・ザ・ガン・プラスワン",
    shortDescription: "UTGの次に行動",
    description:
      "後ろに多くのプレイヤーがいるため、慎重に参加するポジションです。",
  },
  {
    key: "MP",
    reading: "ミドルポジション",
    shortDescription: "テーブルの中央付近",
    description:
      "前半と後半の中間にあたり、少しずつ参加範囲を広げられます。",
  },
  {
    key: "LJ",
    reading: "ロージャック",
    shortDescription: "HJの1つ前",
    description:
      "後ろの人数が少なくなり、比較的参加しやすくなるポジションです。",
  },
  {
    key: "HJ",
    reading: "ハイジャック",
    shortDescription: "COの1つ前",
    description:
      "後ろにいる人数が少なく、広めのハンドで参加しやすいポジションです。",
  },
  {
    key: "CO",
    reading: "カットオフ",
    shortDescription: "BTNの1つ前",
    description:
      "BTNに次いで有利で、広いハンドで参加しやすいポジションです。",
  },
  {
    key: "BTN",
    reading: "ボタン",
    shortDescription: "最も有利なポジション",
    description:
      "フロップ以降に最後に行動しやすく、相手を見てから判断できます。",
  },
  {
    key: "SB",
    reading: "スモールブラインド",
    shortDescription: "小さいブラインドを支払う",
    description:
      "フロップ以降は先に行動しやすいため、難しいポジションです。",
  },
  {
    key: "BB",
    reading: "ビッグブラインド",
    shortDescription: "大きいブラインドを支払う",
    description:
      "すでに1BBを支払っており、プリフロップでは最後に判断できます。",
  },
] as const;

type Position = (typeof positionOptions)[number]["key"];

type PositionDraft = {
  heroPosition: Position | "";
};

type SavedPositions = {
  heroPosition: Position;
  villainPosition: "";
  villains: [];
  savedAt: string;
};

const draftStorageKey = "poker-read-positions-draft";
const savedStorageKey = "poker-read-positions";

function positionInfo(position: Position) {
  return positionOptions.find(
    (option) => option.key === position,
  );
}

export default function PositionsPage() {
  const router = useRouter();

  const [heroPosition, setHeroPosition] =
    useState<Position | "">("");

  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem(
      draftStorageKey,
    );

    if (savedDraft) {
      try {
        const parsed = JSON.parse(
          savedDraft,
        ) as Partial<PositionDraft>;

        setHeroPosition(
          parsed.heroPosition ?? "",
        );
      } catch {
        localStorage.removeItem(
          draftStorageKey,
        );
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        heroPosition,
      }),
    );
  }, [heroPosition, loaded]);

  function selectHero(position: Position) {
    setHeroPosition(position);
    setMessage("");
  }

  function clearPosition() {
    setHeroPosition("");
    setMessage(
      "ポジション選択をクリアしました。",
    );

    localStorage.removeItem(
      draftStorageKey,
    );

    localStorage.removeItem(
      savedStorageKey,
    );
  }

  function savePosition() {
    if (!heroPosition) {
      setMessage(
        "自分のポジションを選択してください。",
      );
      return;
    }

    const savedPositions: SavedPositions = {
      heroPosition,
      villainPosition: "",
      villains: [],
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      savedStorageKey,
      JSON.stringify(savedPositions),
    );

    localStorage.removeItem(
      draftStorageKey,
    );

    router.push("/preflop");
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
            STEP 3 / 自分のポジション
          </p>

          <h1 className="text-3xl font-bold">
            自分のポジションを選ぶ
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            あなたが座っていた位置を選択してください。
            相手のポジションとスタックは、次のプリフロップ画面で登録します。
          </p>
        </header>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-3/5 rounded-full bg-emerald-500" />
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm font-bold text-emerald-400">
            自分（Hero）
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            自分のポジション
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            あなたが座っていた位置です。
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {positionOptions.map((option) => {
              const selected =
                heroPosition === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() =>
                    selectHero(option.key)
                  }
                  className={`rounded-2xl border p-4 text-left transition active:scale-95 ${
                    selected
                      ? "border-emerald-500 bg-emerald-500 text-slate-950"
                      : "border-slate-700 bg-slate-950"
                  }`}
                >
                  <span className="block text-xl font-bold">
                    {option.key}
                  </span>

                  <span className="mt-1 block text-sm font-bold">
                    {option.reading}
                  </span>

                  <span className="mt-2 block text-xs leading-5">
                    {option.shortDescription}
                  </span>
                </button>
              );
            })}
          </div>

          {heroPosition && (
            <div className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/40 p-4">
              <p className="font-bold text-emerald-300">
                {heroPosition}（
                {positionInfo(heroPosition)?.reading}
                ）
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {
                  positionInfo(heroPosition)
                    ?.description
                }
              </p>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-emerald-900 bg-emerald-950/30 p-5">
          <p className="text-sm font-bold text-emerald-300">
            内容確認
          </p>

          <p className="mt-3 text-sm text-slate-500">
            自分のポジション
          </p>

          <p className="mt-1 text-xl font-bold text-emerald-400">
            {heroPosition
              ? `${heroPosition}（${
                  positionInfo(heroPosition)
                    ?.reading
                }）`
              : "未選択"}
          </p>
        </section>

        {message && (
          <p className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={savePosition}
            className="w-full rounded-2xl bg-emerald-500 p-5 text-lg font-bold text-slate-950 active:scale-95"
          >
            保存して次へ
          </button>

          <button
            type="button"
            onClick={clearPosition}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 font-bold text-slate-300"
          >
            選択をクリア
          </button>
        </div>
      </div>
    </main>
  );
}