"use client";

import { useEffect, useRef, useState } from "react";
import {
  type AiReview, type ReviewMode, deleteReview, normalizeSavedReview, readReviewCache, saveReview,
} from "@/lib/hand-review-storage";

type ReviewState = { handId: string; review: AiReview | null; raw?: unknown; saved: boolean };

/** Key both the request and displayed result by ID, never by the dropdown's current position. */
export function useHandReview(mode: ReviewMode, hand?: { id?: string; [key: string]: unknown }) {
  const handId = hand?.id ?? "";
  const currentId = useRef(handId);
  const inFlight = useRef(false);
  const [state, setState] = useState<ReviewState>({ handId: "", review: null, saved: false });
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    currentId.current = handId;
    const { reviews, warning } = readReviewCache(mode);
    // Synchronize this screen with browser storage after mounting or changing the hand.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ handId, review: reviews[handId] ?? null, saved: Boolean(reviews[handId]) });
    setError(warning);
    setSaveError("");
    return () => { currentId.current = ""; };
  }, [handId, mode]);

  function persist(id: string, raw: unknown, review: AiReview) {
    try {
      saveReview(mode, id, raw);
      if (currentId.current === id) {
        setState({ handId: id, review, raw, saved: true });
        setSaveError("");
      }
    } catch {
      if (currentId.current === id) {
        setState({ handId: id, review, raw, saved: false });
        setSaveError("AIレビューは生成できましたが、このブラウザに保存できませんでした。ページを閉じずに保存を再試行してください。再試行ではAIを呼び出しません。以前のレビューがある場合、その保存内容は残っています。");
      }
    }
  }

  async function generateReview() {
    if (inFlight.current) return;
    if (!hand || !handId) {
      setError("レビュー対象のハンドIDを確認できません。履歴から開き直してください。");
      return;
    }
    if (state.handId === handId && state.review &&
      !window.confirm("AIレビューを再生成しますか？追加のAPI利用料が発生する場合があります。成功して保存できるまで、以前の保存済みレビューは残します。")) return;

    const requestId = handId;
    inFlight.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, hand: { ...hand, mode } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AIレビューを生成できませんでした。");
      const review = normalizeSavedReview(data.review);
      if (!review) throw new Error("AIレビューを取得できませんでした。");
      persist(requestId, data.review, review);
    } catch (caught) {
      if (currentId.current === requestId) {
        setError(caught instanceof Error ? caught.message : "AIレビューを生成できませんでした。");
      }
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  function retrySave() {
    if (state.handId === handId && state.review && state.raw) persist(handId, state.raw, state.review);
  }

  function deleteCachedReview() {
    if (inFlight.current || !window.confirm("このハンドの保存済みAIレビューを削除しますか？ハンド履歴は残ります。")) return;
    try {
      deleteReview(mode, handId);
      setState({ handId, review: null, saved: false });
      setError("");
      setSaveError("");
    } catch {
      setError("保存済みAIレビューを削除できませんでした。ページを開き直して状態を確認してください。");
    }
  }

  return {
    review: state.handId === handId ? state.review : null,
    saved: state.handId === handId && state.saved,
    error, saveError, loading, generateReview, retrySave, deleteCachedReview,
  };
}
