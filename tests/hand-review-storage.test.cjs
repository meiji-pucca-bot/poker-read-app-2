/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner loads TypeScript through CommonJS without extra dependencies. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

// Use the project's existing TypeScript compiler; no extra test dependency or API key is needed.
const filename = path.resolve(__dirname, "../lib/hand-review-storage.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = new Module(filename, module);
loaded._compile(compiled, filename);
const { readReviewCache, saveReview, deleteReview, clearReviewCache, reviewCacheKeys, normalizeSavedReview } = loaded.exports;

class MemoryStorage {
  constructor(entries = {}) { this.data = new Map(Object.entries(entries)); this.writes = []; }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); this.writes.push(key); }
  removeItem(key) { this.data.delete(key); this.writes.push(key); }
}
function review(totalScore = 80) {
  const street = { score: totalScore, verdict: "OK", heroAction: "Call", recommendedAction: "Call", goodPoints: ["good"], improvementPoints: ["improve"], detail: "detail" };
  return { totalScore, grade: "A", stars: 4, shortSummary: "summary", strongestStreet: "flop", mainLeak: "sizing", goodPoints: ["good"], improvementPoints: ["improve"], streets: { preflop: street, flop: street, turn: street, river: street }, nextGoals: ["goal"], finalMessage: "message" };
}

for (const mode of ["cash", "tournament"]) {
  const { legacy, current } = reviewCacheKeys(mode);
  test(`${mode}: v2 review is readable after a fresh load without any write`, () => {
    const storage = new MemoryStorage({ [current]: JSON.stringify({ handA: review() }) });
    assert.equal(readReviewCache(mode, storage).reviews.handA.totalScore, 80);
    assert.equal(readReviewCache(mode, storage).reviews.handA.shortSummary, "summary");
    assert.deepEqual(storage.writes, []);
  });
  test(`${mode}: merges legacy and v2, v2 wins, neither source changes`, () => {
    const old = JSON.stringify({ legacyOnly: { totalScore: 60, summary: "old" }, shared: review(60) });
    const next = JSON.stringify({ newOnly: review(90), shared: review(85) });
    const storage = new MemoryStorage({ [legacy]: old, [current]: next });
    const { reviews } = readReviewCache(mode, storage);
    assert.deepEqual(Object.keys(reviews).sort(), ["legacyOnly", "newOnly", "shared"]);
    assert.equal(reviews.shared.totalScore, 85);
    assert.equal(reviews.legacyOnly.shortSummary, "old");
    assert.equal(reviews.legacyOnly.streets.preflop.score, null);
    assert.equal(reviews.legacyOnly.legacy, true);
    assert.equal(storage.getItem(legacy), old);
    assert.equal(storage.getItem(current), next);
    assert.deepEqual(storage.writes, []);
  });
  test(`${mode}: saving / re-review preserves unrelated records, hands, favorites and legacy bytes`, () => {
    const other = { ...review(71), customField: { preserve: true } };
    const old = JSON.stringify({ handA: review(60) });
    const hands = JSON.stringify([{ id: "handA", savedAt: "2026-01-01", customHandData: [1, 2, 3] }]);
    const storage = new MemoryStorage({ [legacy]: old, [current]: JSON.stringify({ handA: review(70), other, malformedEntry: { unknown: true } }), "poker-read-hands": hands, "poker-read-favorite-hands": '["handA"]' });
    saveReview(mode, "handA", review(92), storage);
    const written = JSON.parse(storage.getItem(current));
    assert.equal(written.handA.totalScore, 92);
    assert.deepEqual(written.other, other);
    assert.deepEqual(written.malformedEntry, { unknown: true });
    assert.equal(storage.getItem(legacy), old);
    assert.equal(storage.getItem("poker-read-hands"), hands);
    assert.equal(storage.getItem("poker-read-favorite-hands"), '["handA"]');
    assert.deepEqual(storage.writes, [current]);
    assert.equal(readReviewCache(mode, storage).reviews.handA.totalScore, 92);
  });
  test(`${mode}: save reads the latest cache and preserves another tab's earlier addition`, () => {
    const storage = new MemoryStorage();
    readReviewCache(mode, storage);
    storage.setItem(current, JSON.stringify({ otherTab: review(73) }));
    saveReview(mode, "handA", review(88), storage);
    assert.equal(readReviewCache(mode, storage).reviews.otherTab.totalScore, 73);
  });
  test(`${mode}: malformed current cache is never overwritten and legacy still loads`, () => {
    const storage = new MemoryStorage({ [current]: "{broken", [legacy]: JSON.stringify({ handA: review(61) }) });
    const loaded = readReviewCache(mode, storage);
    assert.equal(loaded.reviews.handA.totalScore, 61);
    assert.ok(loaded.warning);
    assert.throws(() => saveReview(mode, "handA", review(90), storage));
    assert.equal(storage.getItem(current), "{broken");
    assert.deepEqual(storage.writes, []);
  });
  test(`${mode}: invalid v2 entry does not hide valid legacy review`, () => {
    const storage = new MemoryStorage({ [current]: JSON.stringify({ handA: null, bad: [], bad2: { totalScore: "wrong" } }), [legacy]: JSON.stringify({ handA: review(61) }) });
    assert.equal(readReviewCache(mode, storage).reviews.handA.totalScore, 61);
    assert.deepEqual(Object.keys(readReviewCache(mode, storage).reviews), ["handA"]);
  });
  test(`${mode}: storage quota failure leaves the prior review untouched; save-only retry succeeds`, () => {
    const original = JSON.stringify({ handA: review(60) });
    const storage = new MemoryStorage({ [current]: original });
    storage.setItem = () => { throw new Error("QuotaExceededError"); };
    assert.throws(() => saveReview(mode, "handA", review(95), storage));
    assert.equal(storage.getItem(current), original);
    storage.setItem = MemoryStorage.prototype.setItem;
    saveReview(mode, "handA", review(95), storage);
    assert.equal(readReviewCache(mode, storage).reviews.handA.totalScore, 95);
  });
  test(`${mode}: targeted delete removes both versions, preserving other reviews and hands`, () => {
    const storage = new MemoryStorage({ [legacy]: JSON.stringify({ handA: review(60), oldOther: review(65) }), [current]: JSON.stringify({ handA: review(90), newOther: review(91) }), "poker-read-hands": '[{"id":"handA"}]' });
    deleteReview(mode, "handA", storage);
    assert.equal(readReviewCache(mode, storage).reviews.handA, undefined);
    assert.deepEqual(Object.keys(readReviewCache(mode, storage).reviews).sort(), ["newOther", "oldOther"]);
    assert.equal(storage.getItem("poker-read-hands"), '[{"id":"handA"}]');
  });
  test(`${mode}: explicit clear removes only this mode's review keys`, () => {
    const other = reviewCacheKeys(mode === "cash" ? "tournament" : "cash");
    const storage = new MemoryStorage({ [legacy]: "{}", [current]: "{}", [other.current]: '{"keep":true}', "poker-read-hands": "[]" });
    clearReviewCache(mode, storage);
    assert.equal(storage.getItem(legacy), null);
    assert.equal(storage.getItem(current), null);
    assert.equal(storage.getItem(other.current), '{"keep":true}');
    assert.equal(storage.getItem("poker-read-hands"), "[]");
  });
}

test("blocked storage reads give a warning; saving throws instead of claiming success", () => {
  const storage = { getItem() { throw new Error("SecurityError"); }, setItem() { throw new Error("SecurityError"); }, removeItem() {} };
  assert.ok(readReviewCache("cash", storage).warning);
  assert.throws(() => saveReview("cash", "A", review(), storage));
});
test("arrays/null/scalars are not treated as a cache or rewritten", () => {
  for (const raw of ["[]", "null", "1", '"text"']) {
    const key = reviewCacheKeys("cash").current;
    const storage = new MemoryStorage({ [key]: raw });
    assert.ok(readReviewCache("cash", storage).warning);
    assert.throws(() => saveReview("cash", "A", review(), storage));
    assert.equal(storage.getItem(key), raw);
  }
});
test("normalization protects rendering against missing arrays, null street data and invalid stars", () => {
  const value = normalizeSavedReview({ totalScore: 72, stars: 999, goodPoints: ["yes", null, 2], nextGoals: null, streets: { preflop: null } });
  assert.equal(value.stars, 5);
  assert.deepEqual(value.goodPoints, ["yes"]);
  assert.deepEqual(value.nextGoals, []);
  assert.equal(value.streets.preflop.score, null);
  assert.equal(normalizeSavedReview({}), null);
});
test("special object keys are data, not inherited reviews", () => {
  const storage = new MemoryStorage({ [reviewCacheKeys("cash").current]: JSON.stringify({ constructor: review(79) }) });
  assert.equal(readReviewCache("cash", storage).reviews.toString, undefined);
  saveReview("cash", "__proto__", review(83), storage);
  assert.equal(readReviewCache("cash", storage).reviews.__proto__.totalScore, 83);
});
test("deletion parses both sources before writing, preserving data when one is corrupted", () => {
  const keys = reviewCacheKeys("cash");
  const original = JSON.stringify({ A: review() });
  const storage = new MemoryStorage({ [keys.legacy]: original, [keys.current]: "{bad" });
  assert.throws(() => deleteReview("cash", "A", storage));
  assert.equal(storage.getItem(keys.legacy), original);
  assert.deepEqual(storage.writes, []);
});

test('new saves record a valid review date, legacy dates are never invented', () => {
  const storage = new MemoryStorage();
  const before = Date.now();
  saveReview('cash', 'dated', review(66), storage);
  const saved = readReviewCache('cash', storage).reviews.dated;
  assert.ok(Date.parse(saved.reviewedAt) >= before);
  assert.equal(normalizeSavedReview({ totalScore: 50, reviewedAt: 'invalid' }).reviewedAt, undefined);
  assert.equal(normalizeSavedReview({ totalScore: 50 }).reviewedAt, undefined);
});
