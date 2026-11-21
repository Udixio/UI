import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ADAPTER_FILES, isStale, measure, reportPath } from './size-report.mjs';

const committedText = readFileSync(reportPath, 'utf8');
const committed = JSON.parse(committedText);
const budgets = JSON.parse(readFileSync(new URL('../.size-limit.json', import.meta.url), 'utf8'));

test('size-report.json measures every entry of the budgets, and the motion part of each adapter', () => {
  assert.deepEqual(Object.keys(committed.entries), budgets.map(({ name }) => name));
  assert.deepEqual(Object.keys(committed.adapters), Object.keys(ADAPTER_FILES));
  for (const bytes of [...Object.values(committed.entries), ...Object.values(committed.adapters)]) {
    assert.ok(Number.isInteger(bytes) && bytes > 0, `${bytes} is not a size in bytes`);
  }
});

test('size-report.json is not stale: measuring the package again gives the committed sizes', { timeout: 120_000 }, async () => {
  const report = await measure();
  assert.equal(isStale(committedText, report), false, 'size-report.json is stale: run `node scripts/size-report.mjs` in packages/motion and commit it');
  assert.deepEqual({ entries: report.entries, adapters: report.adapters }, { entries: committed.entries, adapters: committed.adapters });
});
