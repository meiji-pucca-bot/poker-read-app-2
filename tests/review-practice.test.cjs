/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner loads TypeScript through CommonJS without extra dependencies. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../lib/review-practice.ts');
const loaded = new Module(filename, module);
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { filterPracticeEntries, reviewTasks } = loaded.exports;
const base = { mode: 'all', maxScore: 100, issue: '', query: '', sort: 'scoreLow' };
const entry = (id, score, mode = 'cash', reviewedAt) => ({ mode, hand: { id }, review: { totalScore: score, reviewedAt, mainLeak: 'ベットサイズ', improvementPoints: ['薄いコール'], nextGoals: ['ICMを確認'], streets: { preflop: { improvementPoints: ['レンジ'] } } } });
const entries = [entry('high', 90), entry('zero', 0, 'tournament'), entry('low', 40, 'cash', '2026-01-01'), entry('recent', 40, 'tournament', '2026-02-01')];
test('practice is low-score first, including score zero, without mutating inputs', () => {
 const before = JSON.stringify(entries);
 assert.deepEqual(filterPracticeEntries(entries, base).map(x => x.hand.id), ['zero', 'recent', 'low', 'high']);
 assert.equal(JSON.stringify(entries), before);
});
test('mode, score, exact primary issue and keywords compose', () => {
 assert.deepEqual(filterPracticeEntries(entries, { ...base, mode: 'cash', maxScore: 60, issue: 'ベットサイズ', query: ' icm ' }).map(x => x.hand.id), ['low']);
 assert.equal(filterPracticeEntries(entries, { ...base, query: 'unknown' }).length, 0);
 assert.equal(filterPracticeEntries(entries, { ...base, issue: 'other' }).length, 0);
});
test('latest review sorting puts undated legacy reviews last', () => {
 assert.deepEqual(filterPracticeEntries(entries, { ...base, sort: 'reviewNewest' }).map(x => x.hand.id), ['recent', 'low', 'zero', 'high']);
});
test('tasks include street issues and goals with no duplicate or missing marker', () => {
 const review = { ...entries[0].review, mainLeak: '記録なし', improvementPoints: ['レンジ', ''], nextGoals: ['レンジ'] };
 assert.deepEqual(reviewTasks(review), ['レンジ']);
 assert.equal(filterPracticeEntries(entries, { ...base, query: 'レンジ' }).length, 4);
});
