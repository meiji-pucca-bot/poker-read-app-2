"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TableDraft = {
  venue: string;
  tableName: string;
  smallBlind: string;
  bigBlind: string;
  heroStack: string;
};

type SavedTable = TableDraft & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

const emptyDraft: TableDraft = {
  venue: "",
  tableName: "",
  smallBlind: "",
  bigBlind: "",
  heroStack: "",
};

const draftStorageKey = "poker-read-table-draft";
const currentTableStorageKey = "poker-read-current-table";
const tableHistoryStorageKey = "poker-read-tables";

function formatNumber(value: string | number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString("ja-JP");
}

function calculateBb(value: string, bigBlind: string) {
  const amount = Number(value);
  const bb = Number(bigBlind);

  if (
    !value ||
    !bigBlind ||
    !Number.isFinite(amount) ||
    !Number.isFinite(bb) ||
    bb <= 0
  ) {
    return null;
  }

  return amount / bb;
}

function readSavedTables(): SavedTable[] {
  const saved = localStorage.getItem(tableHistoryStorageKey);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function NewTablePage() {
  const router = useRouter();

  const [draft, setDraft] = useState<TableDraft>(emptyDraft);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem(draftStorageKey);

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as Partial<TableDraft>;

        setDraft({
          venue: parsed.venue ?? "",
          tableName: parsed.tableName ?? "",
          smallBlind: parsed.smallBlind ?? "",
          bigBlind: parsed.bigBlind ?? "",
          heroStack: parsed.heroStack ?? "",
        });
      } catch {
        localStorage.removeItem(draftStorageKey);
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
      JSON.stringify(draft),
    );
  }, [draft, loaded]);

  const heroStackBb = useMemo(
    () => calculateBb(draft.heroStack, draft.bigBlind),
    [draft.heroStack, draft.bigBlind],
  );

  function updateField(
    field: keyof TableDraft,
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
  }

  function updateNumberField(
    field:
      | "smallBlind"
      | "bigBlind"
      | "heroStack",
    value: string,
  ) {
    if (value === "" || /^\d*$/.test(value)) {
      updateField(field, value);
    }
  }

  function clearDraft() {
    setDraft(emptyDraft);
    localStorage.removeItem(draftStorageKey);
    setMessage("入力内容をクリアしました。");
  }

  function saveTable() {
    if (!draft.venue.trim()) {
      setMessage("開催場所を入力してください。");
      return;
    }

    const smallBlind = Number(draft.smallBlind);
    const bigBlind = Number(draft.bigBlind);

    if (
      !draft.smallBlind ||
      !draft.bigBlind ||
      !Number.isFinite(smallBlind) ||
      !Number.isFinite(bigBlind) ||
      smallBlind <= 0 ||
      bigBlind <= 0
    ) {
      setMessage("SBとBBを正しく入力してください。");
      return;
    }

    if (smallBlind >= bigBlind) {
      setMessage("SBはBBより小さい金額にしてください。");
      return;
    }

    const heroStack = Number(draft.heroStack);

    if (
      !draft.heroStack ||
      !Number.isFinite(heroStack) ||
      heroStack <= 0
    ) {
      setMessage("自分のスタックを入力してください。");
      return;
    }

    const now = new Date().toISOString();

    const table: SavedTable = {
      id: crypto.randomUUID(),
      venue: draft.venue.trim(),
      tableName: draft.tableName.trim(),
      smallBlind: draft.smallBlind,
      bigBlind: draft.bigBlind,
      heroStack: draft.heroStack,
      createdAt: now,
      updatedAt: now,
    };

    localStorage.setItem(
      currentTableStorageKey,
      JSON.stringify(table),
    );

    const previousTables = readSavedTables();

    localStorage.setItem(
      tableHistoryStorageKey,
      JSON.stringify([table, ...previousTables]),
    );

    localStorage.removeItem(draftStorageKey);

    router.push("/hero-hand");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-6 pt-[max(56px,calc(env(safe-area-inset-top)+20px))] text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link
            href="/new-hand"
            className="relative z-20 mb-5 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-slate-400 active:bg-white/10"
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
              className="block text-lg font-bold"
            >
              開催場所
            </label>

            <p className="mt-1 text-sm text-slate-400">
              店舗名、友人宅、オンラインなど
            </p>

            <input
              id="venue"
              type="text"
              value={draft.venue}
              onChange={(event) =>
                updateField("venue", event.target.value)
              }
              placeholder="例：バッドビート"
              className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-lg outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="tableName"
              className="block text-lg font-bold"
            >
              テーブル名・番号
              <span className="ml-2 text-sm font-normal text-slate-400">
                任意
              </span>
            </label>

            <input
              id="tableName"
              type="text"
              value={draft.tableName}
              onChange={(event) =>
                updateField("tableName", event.target.value)
              }
              placeholder="例：8番テーブル"
              className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-lg outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <h2 className="text-lg font-bold">
              ブラインド
            </h2>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="smallBlind"
                  className="block font-bold"
                >
                  SB
                </label>

                <input
                  id="smallBlind"
                  inputMode="numeric"
                  value={draft.smallBlind}
                  onChange={(event) =>
                    updateNumberField(
                      "smallBlind",
                      event.target.value,
                    )
                  }
                  placeholder="500"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-xl font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="bigBlind"
                  className="block font-bold"
                >
                  BB
                </label>

                <input
                  id="bigBlind"
                  inputMode="numeric"
                  value={draft.bigBlind}
                  onChange={(event) =>
                    updateNumberField(
                      "bigBlind",
                      event.target.value,
                    )
                  }
                  placeholder="1000"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-xl font-bold outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
  <label
    htmlFor="heroStack"
    className="text-lg font-bold"
  >
    自分のスタック
  </label>

  <span className="text-sm font-normal text-emerald-300">
    Hero（自分）
  </span>
</div>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              正確でなくても、現在のおおよその金額でOKです。
            </p>

            <input
              id="heroStack"
              inputMode="numeric"
              value={draft.heroStack}
              onChange={(event) =>
                updateNumberField(
                  "heroStack",
                  event.target.value,
                )
              }
              placeholder="例：65000"
              className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-xl font-bold outline-none focus:border-emerald-500"
            />

            {draft.heroStack && (
              <p className="mt-2 font-bold text-emerald-400">
                {formatNumber(draft.heroStack)}

                {heroStackBb !== null
                  ? `（${Number(
                      heroStackBb.toFixed(2),
                    )}bb）`
                  : ""}
              </p>
            )}

            {!draft.bigBlind && draft.heroStack && (
              <p className="mt-2 text-sm text-slate-500">
                BBを入力するとBB換算されます。
              </p>
            )}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-emerald-900 bg-emerald-950/30 p-5">
          <p className="relative z-20 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-bold text-emerald-300 active:bg-white/10">
  内容確認
</p>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-950 p-3">
              <p className="text-slate-500">
                開催場所
              </p>

              <p className="mt-1 font-bold">
                {draft.venue || "未入力"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-3">
              <p className="text-slate-500">
                テーブル
              </p>

              <p className="mt-1 font-bold">
                {draft.tableName || "未入力"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-3">
              <p className="text-slate-500">
                SB / BB
              </p>

              <p className="mt-1 font-bold">
  {draft.smallBlind && draft.bigBlind
    ? `${draft.smallBlind} / ${draft.bigBlind}`
    : "未入力"}
</p>
            </div>

            <div className="rounded-xl bg-slate-950 p-3">
              <p className="text-slate-500">
                自分のスタック
              </p>

              <p className="mt-1 font-bold">
                {heroStackBb !== null
                  ? `${Number(
                      heroStackBb.toFixed(2),
                    )}bb`
                  : "未計算"}
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
          <button
            type="button"
            onClick={saveTable}
            className="w-full rounded-2xl bg-emerald-500 p-5 text-lg font-bold text-slate-950 active:scale-95"
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