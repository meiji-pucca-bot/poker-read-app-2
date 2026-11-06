# Optional independent React QA

These checks execute the actual application TypeScript/TSX with synthetic localStorage data and mocked network calls. They do not run a browser, use real hand data, or call the AI API. They are separate from the dependency-free `node --test tests/*.test.cjs` suite.

## Setup and run

Run from the repository root after `npm ci`. Install the optional test renderer outside the project so package.json and package-lock.json remain unchanged:

```sh
QA_DEPS="$(mktemp -d)"
npm install --prefix "$QA_DEPS" --ignore-scripts --no-audit --no-fund react@19.2.4 react-test-renderer@19.2.4
export POKER_QA_NODE_MODULES="$QA_DEPS/node_modules"
node tests/qa/independent-review.cjs
node tests/qa/independent-extensions.cjs
node tests/qa/adversarial-render.cjs
```

The only extra direct dependencies are React 19.2.4 and react-test-renderer 19.2.4; their normal transitive dependencies are react-is and scheduler. TypeScript is loaded from the project's existing installation. `POKER_REPO_ROOT` can optionally select another checkout.

## Coverage and results

- 8 review/history cases across cash and tournament: byte-preserving loads, review dates and legacy date labels, encoded direct links, exact selected IDs, no API on reopen, no nested buttons, re-review cancel/failure/success, save-only retry after quota failure.
- 9 backup/practice cases: corrupted data rejection, legacy/current conflicts and stable duplicates, rollback journal recovery, stale preview, cancel/declined confirm/invalid file selection, restore/repeat, recovery UI, learning filters/sorts/links/reset, corrupt-mode handling.
- 2 adversarial rendering cases: inherited object-property action names and invalid pre-existing importance values stay renderable without rewriting saved bytes.

All 19 cases passed during review. Result JSON files are written to the operating system's temporary directory with names beginning `poker-read-`. React prints its normal deprecation warning for react-test-renderer.

## Verification limits

This is component/state execution, not visual browser or mobile QA. Chromium launch was attempted but aborted because this environment denied the required socket operation, including an escalated attempt. No real AI calls or deployment validation are part of these scripts.
