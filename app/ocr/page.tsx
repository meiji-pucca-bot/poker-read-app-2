"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  addOcrHistory,
  clearOcrHistory,
  fileToDataUrl,
  loadOcrHistory,
  saveOcrDraft,
  validateOcrFile,
  type TournamentOcrHistoryItem,
  type TournamentOcrResult,
} from "@/lib/tournament-ocr";
import type {
  TournamentForm,
} from "@/lib/tournament-storage";

const FIELD_CONFIG: Array<{
  key: keyof TournamentForm;
  label: string;
  placeholder: string;
  inputMode: "text" | "numeric";
}> = [
  {
    key: "tournamentName",
    label: "大会名",
    placeholder: "例：Daily Special",
    inputMode: "text",
  },
  {
    key: "buyIn",
    label: "バイイン",
    placeholder: "例：3000",
    inputMode: "numeric",
  },
  {
    key: "startingPlayers",
    label: "開始人数",
    placeholder: "例：500",
    inputMode: "numeric",
  },
  {
    key: "remainingPlayers",
    label: "残り人数",
    placeholder: "例：120",
    inputMode: "numeric",
  },
  {
    key: "itmPlayers",
    label: "ITM人数",
    placeholder: "例：72",
    inputMode: "numeric",
  },
  {
    key: "heroStack",
    label: "Heroスタック",
    placeholder: "例：24500",
    inputMode: "numeric",
  },
  {
    key: "averageStack",
    label: "平均スタック",
    placeholder: "例：31000",
    inputMode: "numeric",
  },
  {
    key: "smallBlind",
    label: "SB",
    placeholder: "例：500",
    inputMode: "numeric",
  },
  {
    key: "bigBlind",
    label: "BB",
    placeholder: "例：1000",
    inputMode: "numeric",
  },
  {
    key: "ante",
    label: "Ante",
    placeholder: "例：100",
    inputMode: "numeric",
  },
  {
    key: "level",
    label: "レベル",
    placeholder: "例：Level 12",
    inputMode: "text",
  },
];

function confidenceLabel(
  confidence: TournamentOcrResult["confidence"],
) {
  if (confidence === "high") {
    return "高";
  }

  if (confidence === "medium") {
    return "中";
  }

  return "低";
}

export default function OcrPage() {
  const router = useRouter();
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");
  const [imageDataUrl, setImageDataUrl] =
    useState("");
  const [fileName, setFileName] =
    useState("");
  const [result, setResult] =
    useState<TournamentOcrResult | null>(
      null,
    );
  const [history, setHistory] = useState<
    TournamentOcrHistoryItem[]
  >([]);
  const [isDragging, setIsDragging] =
    useState(false);
  const [isAnalyzing, setIsAnalyzing] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setHistory(loadOcrHistory());
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function selectFile(file: File) {
    const validationError =
      validateOcrFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setError("");
    setResult(null);
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      setImageDataUrl(
        await fileToDataUrl(file),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "画像を読み込めませんでした。",
      );
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (file) {
      void selectFile(file);
    }

    event.target.value = "";
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      void selectFile(file);
    }
  }

  async function analyzeImage() {
    if (!imageDataUrl) {
      setError(
        "解析する画像を選択してください。",
      );
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetch(
        "/api/tournament-ocr",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            imageDataUrl,
          }),
        },
      );

      const data =
        (await response.json()) as {
          result?: TournamentOcrResult;
          error?: string;
        };

      if (!response.ok || !data.result) {
        throw new Error(
          data.error ||
            "画像を解析できませんでした。",
        );
      }

      setResult(data.result);
      setHistory(
        addOcrHistory(data.result),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "画像を解析できませんでした。",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function updateField(
    field: keyof TournamentForm,
    value: string,
  ) {
    setResult((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        form: {
          ...current.form,
          [field]: value,
        },
      };
    });
  }

  function openInTournamentNavi(
    form: TournamentForm,
  ) {
    const saved = saveOcrDraft(form);

    if (!saved) {
      setError(
        "OCR結果を端末に保存できませんでした。",
      );
      return;
    }

    router.push("/tournament-navi");
  }

  function reuseHistory(
    item: TournamentOcrHistoryItem,
  ) {
    setResult(item.result);
    setError("");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function deleteHistory() {
    const confirmed = window.confirm(
      "OCR履歴をすべて削除しますか？",
    );

    if (!confirmed) {
      return;
    }

    clearOcrHistory();
    setHistory([]);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-4 pb-[max(40px,env(safe-area-inset-bottom))] pt-[max(24px,calc(env(safe-area-inset-top)+12px))] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-28 top-0 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute -left-28 top-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl">
        <header>
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-white/55 transition hover:bg-white/[0.08]"
          >
            ‹ HOME
          </Link>

          <p className="mt-6 text-xs font-black tracking-[0.2em] text-violet-300">
            OPENAI VISION
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            📷 大会スクショ読込
          </h1>

          <p className="mt-3 text-sm font-medium leading-6 text-white/45">
            大会画面のスクリーンショットから情報を抽出し、
            Tournament Naviへ引き継ぎます。
          </p>
        </header>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
          <div
            role="button"
            tabIndex={0}
            onClick={() =>
              fileInputRef.current?.click()
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                fileInputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) =>
              event.preventDefault()
            }
            onDragLeave={() =>
              setIsDragging(false)
            }
            onDrop={handleDrop}
            className={`cursor-pointer rounded-3xl border-2 border-dashed p-6 text-center transition ${
              isDragging
                ? "border-violet-300 bg-violet-400/10"
                : "border-white/15 bg-black/20 hover:border-violet-300/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="選択した大会スクリーンショット"
                  className="mx-auto max-h-[420px] w-auto rounded-2xl object-contain"
                />
                <p className="mt-4 truncate text-sm font-black text-white/70">
                  {fileName}
                </p>
                <p className="mt-1 text-xs text-white/35">
                  タップして別の画像を選択
                </p>
              </>
            ) : (
              <>
                <div className="text-5xl">📱</div>
                <h2 className="mt-4 text-lg font-black">
                  スクリーンショットを選択
                </h2>
                <p className="mt-2 text-xs font-medium leading-5 text-white/40">
                  PNG・JPEG・WebP／最大8MB
                  <br />
                  パソコンではドラッグ＆ドロップも使えます
                </p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={analyzeImage}
            disabled={
              !imageDataUrl || isAnalyzing
            }
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-violet-400 to-cyan-300 px-5 py-4 text-base font-black text-[#07150f] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isAnalyzing
              ? "AIが画像を解析中..."
              : "OpenAI Visionで解析"}
          </button>

          <p className="mt-3 text-xs font-medium leading-5 text-white/30">
            画像は解析のためOpenAI APIへ送信されます。
            APIキーはサーバー側だけで使用します。
          </p>
        </section>

        {isAnalyzing && (
          <section className="mt-5 rounded-3xl border border-violet-300/15 bg-violet-400/[0.07] p-6 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/15 border-t-violet-300" />
            <p className="mt-4 font-black">
              大会名・スタック・ブラインドなどを確認しています
            </p>
          </section>
        )}

        {error && (
          <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-medium leading-6 text-red-200">
            {error}
          </p>
        )}

        {result && (
          <section className="mt-6 rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-emerald-400/[0.08] to-transparent p-5 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black tracking-[0.16em] text-emerald-300">
                  OCR RESULT
                </p>
                <h2 className="mt-1 text-xl font-black">
                  抽出結果を確認
                </h2>
              </div>

              <div className="flex gap-2">
                {result.detectedPlatform && (
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">
                    {result.detectedPlatform}
                  </span>
                )}
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
                  信頼度 {confidenceLabel(
                    result.confidence,
                  )}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FIELD_CONFIG.map((field) => (
                <label
                  key={field.key}
                  className={
                    field.key ===
                    "tournamentName"
                      ? "sm:col-span-2"
                      : ""
                  }
                >
                  <span className="mb-2 block text-sm font-bold text-slate-200">
                    {field.label}
                  </span>
                  <input
                    type="text"
                    inputMode={field.inputMode}
                    value={
                      result.form[field.key]
                    }
                    placeholder={
                      field.placeholder
                    }
                    onChange={(event) =>
                      updateField(
                        field.key,
                        event.target.value,
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-semibold text-white outline-none placeholder:text-white/25 focus:border-emerald-400/70"
                  />
                </label>
              ))}
            </div>

            {result.notes.length > 0 && (
              <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4">
                <p className="text-sm font-black text-amber-200">
                  確認ポイント
                </p>
                <div className="mt-2 space-y-2">
                  {result.notes.map(
                    (note, index) => (
                      <p
                        key={`${note}-${index}`}
                        className="text-xs font-medium leading-5 text-white/50"
                      >
                        ・{note}
                      </p>
                    ),
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                openInTournamentNavi(
                  result.form,
                )
              }
              className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-base font-black text-[#07150f] transition hover:bg-emerald-300 active:scale-[0.99]"
            >
              Tournament Naviへ引き継ぐ
            </button>
          </section>
        )}

        {history.length > 0 && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.15em] text-white/35">
                  RECENT OCR
                </p>
                <h2 className="mt-1 text-lg font-black">
                  最近の読込
                </h2>
              </div>

              <button
                type="button"
                onClick={deleteHistory}
                className="rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-xs font-black text-red-300"
              >
                履歴削除
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {history.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-black">
                        {item.result.form
                          .tournamentName ||
                          "名称未入力の大会"}
                      </p>
                      <p className="mt-1 text-xs text-white/35">
                        {new Intl.DateTimeFormat(
                          "ja-JP",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        ).format(
                          new Date(
                            item.result
                              .extractedAt,
                          ),
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        reuseHistory(item)
                      }
                      className="shrink-0 rounded-xl border border-violet-300/20 bg-violet-300/10 px-3 py-2 text-xs font-black text-violet-200"
                    >
                      再利用
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
