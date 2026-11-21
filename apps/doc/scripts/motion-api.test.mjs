// The Animation API reference must follow the sources: an export, a signature or a TSDoc that changed without
// `node apps/doc/scripts/motion-api.mjs` leaves src/data/motion-api.json stale, and this test fails.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { checkMotionApi, generateMotionApi, outputPath } from './motion-api.mjs';

test('motion-api.json is current with the sources', async () => {
  const { current } = await checkMotionApi();
  assert.ok(current, 'apps/doc/src/data/motion-api.json is stale: run node apps/doc/scripts/motion-api.mjs');
});

test('every export of every @udixio/motion entry has a symbol, a group and an anchor id', async () => {
  const document = JSON.parse((await generateMotionApi()).json);
  const groups = new Set(document.groups.map((group) => group.id));
  for (const entry of document.entries) {
    for (const name of entry.exports) {
      const id = entry.adapter ? `${entry.adapter}-${name}` : `api-${name}`;
      const symbol = document.symbols[id];
      assert.ok(symbol, `${entry.entry} exports ${name}, which has no symbol`);
      assert.ok(symbol.entries.includes(entry.entry), `${id} does not list ${entry.entry}`);
      assert.ok(groups.has(symbol.group), `${id} is in no group`);
    }
  }
});

test('the main entry lists what src/index.ts exports', async () => {
  const document = JSON.parse(await readFile(outputPath, 'utf8'));
  const main = document.entries.find((entry) => entry.entry === '@udixio/motion');
  for (const name of ['motion', 'connectMotion', 'defineMotion', 'BindOptions', 'MotionBinding']) {
    assert.ok(main.exports.includes(name), `the main entry does not list ${name}`);
  }
});
