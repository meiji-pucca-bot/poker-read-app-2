/** Lossless backups and conservative, journaled merges. localStorage has no transaction
 * or cross-tab lock: close other tabs during restore. Snapshot checks detect changes
 * before writes, but cannot prevent a non-cooperating tab writing during the commit. */
export const BACKUP_KEYS = [
  "poker-read-hands", "poker-read-tournament-hands",
  "poker-read-favorite-hands", "poker-read-tournament-favorite-hands",
  "poker-read-ai-review-cache", "poker-read-ai-review-cache-v2",
  "poker-read-tournament-ai-review-cache", "poker-read-tournament-ai-review-cache-v2",
] as const;
export const RECOVERY_KEY = "poker-read-backup-recovery-v1";
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
type Key = typeof BACKUP_KEYS[number];
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type RecordValue = Record<string, unknown>;
export type Snapshot = Record<Key, string | null>;
export type Backup = { format: "poker-read-backup"; version: 1; exportedAt: string; storage: Snapshot };
export type RestoreStats = { handsAdded: number; reviewsAdded: number; favoritesAdded: number; conflictCopies: number; skippedReviewConflicts: number };
export type RestorePlan = { before: Snapshot; after: Snapshot; stats: RestoreStats };
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const record = (v: unknown): v is RecordValue => !!v && typeof v === "object" && !Array.isArray(v);
function fail(message: string): never { throw new Error(message); }
function getStore(s?: Store): Store { return s ?? window.localStorage; }
function snapshot(s: Store): Snapshot { return Object.fromEntries(BACKUP_KEYS.map(k => [k, s.getItem(k)])) as Snapshot; }
function validateSnapshot(v: unknown): asserts v is Snapshot {
  if (!record(v) || Object.keys(v).length !== BACKUP_KEYS.length || BACKUP_KEYS.some(k => !own(v, k) || (v[k] !== null && typeof v[k] !== "string"))) fail("バックアップの保存キーまたは値が不正です。");
}
function bounded(v: unknown, depth = 0): void {
  if (depth > 80) fail("データの入れ子が深すぎます。");
  if (v && typeof v === "object") for (const item of Object.values(v)) bounded(item, depth + 1);
}
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (record(v)) return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
  return JSON.stringify(v);
}
const same = (a: unknown, b: unknown) => canonical(a) === canonical(b);
function hash(v: unknown): string {
  const text = canonical(v); let a = 2166136261; let b = 5381;
  for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ text.charCodeAt(i); }
  return `${(a >>> 0).toString(16)}${(b >>> 0).toString(16)}`;
}
function fields(v: RecordValue, strings: string[] = [], numbers: string[] = [], booleans: string[] = []) {
  for (const k of strings) if (v[k] != null && typeof v[k] !== "string") fail(`${k} は文字列である必要があります。`);
  for (const k of numbers) if (v[k] != null && (typeof v[k] !== "number" || !Number.isFinite(v[k]))) fail(`${k} は数値である必要があります。`);
  for (const k of booleans) if (v[k] != null && typeof v[k] !== "boolean") fail(`${k} は真偽値である必要があります。`);
}
function obj(v: unknown, check: (r: RecordValue) => void) { if (v == null) return; if (!record(v)) fail("項目のオブジェクト形式が不正です。"); check(v); }
function arr(v: unknown, check: (r: RecordValue) => void) { if (v == null) return; if (!Array.isArray(v)) fail("項目の配列形式が不正です。"); for (const x of v) { if (!record(x)) fail("配列の項目が不正です。"); check(x); } }
const card = (r: RecordValue) => fields(r, ["rank", "suit"]);
const player = (r: RecordValue) => { fields(r, ["id", "position", "stack", "handText"], [], ["handKnown"]); obj(r.firstCard, card); obj(r.secondCard, card); };
const action = (r: RecordValue) => fields(r, ["id", "playerId", "role", "position", "actor", "action", "amount"], ["addedAmount", "potBefore", "potPercent"]);
const street = (r: RecordValue) => { fields(r, [], ["startingPot", "endingPot"]); arr(r.board, card); arr(r.actions, action); arr(r.villains, player); };
function hand(r: RecordValue) {
  if (typeof r.id !== "string" || !r.id.trim() || r.id.length > 4096) fail("ハンドIDが不正です。");
  fields(r, ["savedAt", "mode"]);
  obj(r.table, x => fields(x, ["venue", "tableName", "smallBlind", "bigBlind", "heroStack"]));
  obj(r.positions, x => { fields(x, ["heroPosition", "villainPosition"]); arr(x.villains, player); });
  obj(r.heroHand, x => { fields(x, ["notation"]); obj(x.firstCard, card); obj(x.secondCard, card); });
  for (const k of ["preflop", "flop", "turn", "river"]) obj(r[k], street);
  obj(r.result, x => { fields(x, ["type", "label", "showdown", "memo"], ["importance"]); if (x.importance != null && (!Number.isInteger(x.importance) || (x.importance as number) < 0 || (x.importance as number) > 5)) fail("重要度は0〜5の整数である必要があります。"); arr(x.showdownPlayers, player); obj(x.villainHand, y => { fields(y, ["text"]); obj(y.firstCard, card); obj(y.secondCard, card); }); });
  obj(r.tournament, x => fields(x, ["id", "tournamentName", "phase"], ["smallBlind", "bigBlind", "ante", "heroStack", "heroStackBb", "remainingPlayers", "paidPlaces", "currentRank"], ["considerIcm"]));
}
function review(r: RecordValue) {
  fields(r, ["grade", "shortSummary", "summary", "strongestStreet", "mainLeak", "finalMessage", "reviewedAt"], ["totalScore", "stars"], ["legacy"]);
  const lists = (x: RecordValue, keys: string[]) => { for (const k of keys) if (x[k] != null && (!Array.isArray(x[k]) || !(x[k] as unknown[]).every(v => typeof v === "string"))) fail("レビューのリスト形式が不正です。"); };
  lists(r, ["goodPoints", "improvementPoints", "nextGoals"]);
  obj(r.streets, x => { for (const k of ["preflop", "flop", "turn", "river"]) obj(x[k], y => { fields(y, ["verdict", "heroAction", "recommendedAction", "detail"], ["score"]); lists(y, ["goodPoints", "improvementPoints"]); }); });
}
function parse(s: Snapshot): Record<Key, unknown> {
  validateSnapshot(s);
  return Object.fromEntries(BACKUP_KEYS.map((k, i) => {
    const v: unknown = s[k] === null ? (i < 4 ? [] : {}) : JSON.parse(s[k]!); bounded(v);
    if (i < 2) {
      if (!Array.isArray(v)) fail("ハンド履歴が配列ではありません。");
      const ids = new Set<string>();
      for (const item of v) { if (!record(item)) fail("ハンド形式が不正です。"); hand(item); const id = item.id as string; if (ids.has(id)) fail("ハンドIDが重複しています。"); ids.add(id); }
    } else if (i < 4) {
      if (!Array.isArray(v) || !v.every(x => typeof x === "string" && x.length > 0)) fail("お気に入りの形式が不正です。");
    } else {
      if (!record(v)) fail("レビューキャッシュがオブジェクトではありません。");
      for (const x of Object.values(v)) { if (!record(x)) fail("レビュー形式が不正です。"); review(x); }
    }
    return [k, v];
  })) as Record<Key, unknown>;
}
export function createBackup(supplied?: Store): Backup {
  return { format: "poker-read-backup", version: 1, exportedAt: new Date().toISOString(), storage: snapshot(getStore(supplied)) };
}
export function hasPendingRecovery(supplied?: Store): boolean { return getStore(supplied).getItem(RECOVERY_KEY) !== null; }
export function planRestore(json: string, supplied?: Store): RestorePlan {
  if (new TextEncoder().encode(json).byteLength > MAX_BACKUP_BYTES) fail("バックアップは20MB以下にしてください。");
  const file: unknown = JSON.parse(json);
  if (!record(file) || file.format !== "poker-read-backup" || file.version !== 1 || typeof file.exportedAt !== "string" || !Number.isFinite(Date.parse(file.exportedAt))) fail("対応していないバックアップ形式です。");
  validateSnapshot(file.storage);
  const s = getStore(supplied);
  if (hasPendingRecovery(s)) fail("前回の復元が未完了です。先に復旧してください。");
  const before = snapshot(s); const current = parse(before); const incoming = parse(file.storage);
  const stats: RestoreStats = { handsAdded: 0, reviewsAdded: 0, favoritesAdded: 0, conflictCopies: 0, skippedReviewConflicts: 0 };
  for (const mode of [0, 1]) {
    const hk = BACKUP_KEYS[mode], fk = BACKUP_KEYS[mode + 2];
    const rk = [BACKUP_KEYS[4 + mode * 2], BACKUP_KEYS[5 + mode * 2]];
    const hands = current[hk] as RecordValue[], added = incoming[hk] as RecordValue[];
    const handMap = new Map(hands.map(h => [h.id as string, h]));
    const importMap = new Map(added.map(h => [h.id as string, h]));
    const caches = rk.map(k => current[k] as RecordValue), incomingCaches = rk.map(k => incoming[k] as RecordValue);
    const ids = new Set([...importMap.keys(), ...incomingCaches.flatMap(c => Object.keys(c))]);
    const remap = new Map<string, string>(); const skip = new Set<string>();
    for (const id of ids) {
      const ih = importMap.get(id), ch = handMap.get(id);
      const incomingReviews = incomingCaches.map(c => own(c, id) ? c[id] : null);
      const currentReviews = caches.map(c => own(c, id) ? c[id] : null);
      // Cross-generation conflicts matter too: importing v2 must not hide an old review.
      const reviewConflict = incomingReviews.some((r, i) => r !== null && !same(currentReviews[i], r) && currentReviews.some(c => c !== null && !same(c, r)));
      const handConflict = !!ih && !!ch && !same(ih, ch);
      let target = id;
      if (handConflict || reviewConflict) {
        const base = ih ?? ch;
        if (!base) { skip.add(id); stats.skippedReviewConflicts += incomingReviews.filter(r => r !== null).length; continue; }
        const root = `${id}~import-${hash({ hand: base, reviews: incomingReviews })}`;
        target = root;
        for (let n = 1; ; n++) {
          const candidate = handMap.get(target);
          const expected = { ...base, id: target };
          const occupiedReviews = caches.some((c, i) => own(c, target) && (incomingReviews[i] === null || !same(c[target], incomingReviews[i])));
          if ((!candidate || same(candidate, expected)) && !occupiedReviews) break;
          target = `${root}-${n}`;
        }
        if (!handMap.has(target)) { const copy = { ...base, id: target }; hands.push(copy); handMap.set(target, copy); stats.handsAdded++; stats.conflictCopies++; }
      } else if (ih && !ch) { hands.push(ih); handMap.set(id, ih); stats.handsAdded++; }
      remap.set(id, target);
      for (let i = 0; i < 2; i++) if (incomingReviews[i] !== null && !own(caches[i], target)) {
        Object.defineProperty(caches[i], target, { value: incomingReviews[i], enumerable: true, configurable: true, writable: true }); stats.reviewsAdded++;
      }
    }
    const favorites = current[fk] as string[]; const set = new Set(favorites);
    for (const id of incoming[fk] as string[]) {
      if (skip.has(id)) continue;
      const target = remap.get(id) ?? id;
      if (!set.has(target)) { favorites.push(target); set.add(target); stats.favoritesAdded++; }
    }
  }
  const after = { ...before };
  const original = parse(before);
  for (const k of BACKUP_KEYS) if (!same(original[k], current[k])) after[k] = JSON.stringify(current[k]);
  return { before, after, stats };
}
function write(s: Store, k: Key, value: string | null) { if (value === null) s.removeItem(k); else s.setItem(k, value); }
function assertSnapshot(s: Store, expected: Snapshot) { if (BACKUP_KEYS.some(k => s.getItem(k) !== expected[k])) fail("保存データが変更されました。他のタブを閉じ、プレビューからやり直してください。"); }
/** Recover only if every current byte is from this transaction. Never clobber a
 * subsequent edit from another tab. Journal remains available on any failure. */
export function recoverPendingRestore(supplied?: Store): boolean {
  const s = getStore(supplied), raw = s.getItem(RECOVERY_KEY); if (raw === null) return false;
  const j: unknown = JSON.parse(raw);
  if (!record(j) || j.version !== 1) fail("復旧記録を確認できません。保存データを変更していません。");
  validateSnapshot(j.before); validateSnapshot(j.after);
  const before = j.before, after = j.after;
  for (const k of BACKUP_KEYS) { const value = s.getItem(k); if (value !== before[k] && value !== after[k]) fail("復元後に別の変更があります。復旧記録を保持しました。手動で確認してください。"); }
  for (const k of BACKUP_KEYS) if (s.getItem(k) !== before[k]) write(s, k, before[k]);
  assertSnapshot(s, before); s.removeItem(RECOVERY_KEY); return true;
}
export function applyRestore(plan: RestorePlan, supplied?: Store): RestoreStats {
  const s = getStore(supplied); parse(plan.before); parse(plan.after);
  if (hasPendingRecovery(s)) fail("未完了の復元があります。先に復旧してください。");
  assertSnapshot(s, plan.before);
  if (BACKUP_KEYS.every(k => plan.before[k] === plan.after[k])) return plan.stats;
  s.setItem(RECOVERY_KEY, JSON.stringify({ version: 1, before: plan.before, after: plan.after }));
  try {
    assertSnapshot(s, plan.before);
    for (const k of BACKUP_KEYS) if (plan.before[k] !== plan.after[k]) write(s, k, plan.after[k]);
    assertSnapshot(s, plan.after); s.removeItem(RECOVERY_KEY);
  } catch (error) {
    try { recoverPendingRestore(s); } catch { fail("復元に失敗し、自動復旧も完了していません。復旧記録を保持しました。他のタブを閉じて復旧を試してください。"); }
    throw error;
  }
  return plan.stats;
}
