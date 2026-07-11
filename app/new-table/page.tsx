"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TableDraft = {
  venue: string;
  tableName: string;
  smallBlind: string;
  bigBlind: string;
  heroStack: string;
  villainStack: string;
};

const emptyDraft: TableDraft = {
  venue: "",
  tableName: "",
  smallBlind: "",
  bigBlind: "",
  heroStack: "",
  villainStack: "",
};

function formatNumber(value: string) {
  const number = Number(value);

  if (!value || !Number.isFinite(number)) {
    return "";
  }

  return number.toLocaleString("ja-JP");
}

function convertToBb(amount: string, bigBlind: string) {
  const amountNumber = Number(amount);
  const bbNumber = Number(bigBlind);

  if (
    !amount ||
    !bigBlind ||
    !Number.isFinite(amountNumber) ||
    !Number.isFinite(bbNumber) ||
    bbNumber <= 0
  ) {
    return null;
  }

  return amountNumber / bbNumber;
}

function formatBb(value: number | null) {
  if (value === null) {
    return "BBを入力すると自動計算されます";
  }

  return `${Number(value.toFixed(2))}bb`;
}

export default function NewTablePage() {
  const [draft, setDraft] = useState<TableDraft>(emptyDraft);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedDraft = localStorage.getItem("poker-read-table-draft");

    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft) as TableDraft;
        setDraft(parsedDraft);
      } catch {
        localStorage.removeItem("poker-read-table-draft");
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    localStorage.setItem(
      "poker-read-table-draft",
      JSON.stringify(draft),
    );
  }, [draft, loaded]);

  const heroStackBb = convertToBb(
    draft.heroStack,
    draft.bigBlind,
  );

  const villainStackBb = convertToBb(
    draft.villainStack,
    draft.bigBlind,
  );

  const effectiveStack =
    heroStackBb !== null && villainStackBb !== null
      ? Math.min(heroStackBb, villainStackBb)
      : null;

  function updateField(
    field: keyof TableDraft,
    value: string,
  ) {
    const numericFields: Array<keyof TableDraft> = [
      "smallBlind",
      "bigBlind",
      "heroStack",
      "villainStack",
    ];

    if (
      numericFields.includes(field) &&
      value !== "" &&
      !/^\d*$/.test(value)
    ) {
      return;
    }

    setDraft((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
  }

  function clearDraft() {
    setDraft(emptyDraft);
    localStorage.removeItem("poker-read-table-draft");
    setMessage("入力内容をクリアしました。");
  }

  function saveTable() {
    if (!draft.venue.trim()) {
      setMessage("開催場所を入力してください。");
      return;
    }

    if (
      !draft.smallBlind ||
      !draft.bigBlind ||
      Number(draft.bigBlind) <= 0
    ) {
      setMessage("SBとBBを正しく入力してください。");
      return;
    }

    if (!draft.heroStack || !draft.villainStack) {
      setMessage(
        "自分と相手のスタックを入力してください。",
      );
      return;
    }

    const table = {
      id: crypto.randomUUID(),
      ...draft,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "poker-read-current-table",
      JSON.stringify(table),
    );

    localStorage.removeItem("poker-read-table-draft");

    setMessage(
      "テーブル情報を保存しました。次はポジション入力画面を作ります。",
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link
            href="/new-hand"
            className="mb-5 inline-block text-sm font-semibold text-slate-400"
          >
            ← 前の画面へ戻る
          </Link>

          <p className="mb-2 text-sm font-bold text-emerald-400">
            STEP 1 / テーブル情報
          </p>

          <h1 className="text-3xl font-bold">
            新しいテーブル
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            リングゲーム・キャッシュゲーム用です。
            入力途中の内容は、この端末に自動保存されます。
          </p>
        </header>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-1/5 rounded-full bg-emerald-500" />
        </div>

        <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div>
            <label
              htmlFor="venue"
              className="mb-2 block font-bold"
            >
              開催場所
            </label>

            <p className="mb-2 text-sm text-slate-400">
              店舗名、友人宅、オンラインなど
            </p>

            <input
              id="venue"
              value={draft.venue}
              onChange={(event) =>
                updateField("venue", event.target.value)
              }
              placeholder="例：新宿ポーカールーム"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="tableName"
              className="mb-2 block font-bold"
            >
              テーブル名・番号
              <span className="ml-2 text-sm font-normal text-slate-400">
                任意
              </span>
            </label>

            <input
              id="tableName"
              value={draft.tableName}
              onChange={(event) =>
                updateField("tableName", event.target.value)
              }
              placeholder="例：3番テーブル"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="smallBlind"
                className="mb-2 block font-bold"
              >
                SB
              </label>

              <input
                id="smallBlind"
                inputMode="numeric"
                value={draft.smallBlind}
                onChange={(event) =>
                  updateField(
                    "smallBlind",
                    event.target.value,
                  )
                }
                placeholder="50"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-xl font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="bigBlind"
                className="mb-2 block font-bold"
              >
                BB
              </label>

              <input
                id="bigBlind"
                inputMode="numeric"
                value={draft.bigBlind}
                onChange={(event) =>
                  updateField(
                    "bigBlind",
                    event.target.value,
                  )
                }
                placeholder="100"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-xl font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-5">
            <label
              htmlFor="heroStack"
              className="mb-2 block font-bold"
            >
              自分のスタック
              <span className="ml-2 text-sm font-normal text-slate-400">
                Hero（自分）
              </span>
            </label>

            <p className="mb-2 text-sm text-slate-400">
              正確でなくても、現在のおおよその金額でOKです
            </p>

            <input
              id="heroStack"
              inputMode="numeric"
              value={draft.heroStack}
              onChange={(event) =>
                updateField(
                  "heroStack",
                  event.target.value,
                )
              }
              placeholder="10000"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-xl font-bold outline-none focus:border-emerald-500"
            />

            <p className="mt-2 text-sm font-semibold text-emerald-400">
              {draft.heroStack
                ? `${formatNumber(draft.heroStack)}（${formatBb(
                    heroStackBb,
                  )}）`
                : formatBb(null)}
            </p>
          </div>

          <div>
            <label
              htmlFor="villainStack"
              className="mb-2 block font-bold"
            >
              相手のスタック
              <span className="ml-2 text-sm font-normal text-slate-400">
                Villain（相手）
              </span>
            </label>

            <input
              id="villainStack"
              inputMode="numeric"
              value={draft.villainStack}
              onChange={(event) =>
                updateField(
                  "villainStack",
                  event.target.value,
                )
              }
              placeholder="8500"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-xl font-bold outline-none focus:border-emerald-500"
            />

            <p className="mt-2 text-sm font-semibold text-emerald-400">
              {draft.villainStack
                ? `${formatNumber(
                    draft.villainStack,
                  )}（${formatBb(villainStackBb)}）`
                : formatBb(null)}
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-emerald-900 bg-emerald-950/40 p-5">
          <p className="text-sm text-emerald-300">
            有効スタック
          </p>

          <p className="mt-1 text-2xl font-bold">
            {effectiveStack === null
              ? "未計算"
              : `${Number(
                  effectiveStack.toFixed(2),
                )}bb`}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            実際に勝負できる最大額です。自分と相手のうち、
            少ない方のスタックが基準になります。
          </p>
        </section>

        {message && (
          <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={saveTable}
            className="w-full rounded-2xl bg-emerald-500 p-5 text-lg font-bold text-slate-950 transition active:scale-95"
          >
            保存して次へ
          </button>

          <button
            type="button"
            onClick={clearDraft}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 font-bold text-slate-300"
          >
            入力内容をクリア
          </button>
        </div>
      </div>
    </main>
  );
}