import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const report = () => ({ browser: 'Chromium 123', cpuThrottlingRate: 4, results: ['waapi', 'animejs', 'css', 'motion'].flatMap(provider => [100, 1000].map(elements => ({ provider, elements, scriptMs: 1, framesDropped: 0, longAnimationFrames: { count: 0, durationMs: 0 } }))) });
function validate(value) {
  const dir = mkdtempSync(join(tmpdir(), 'motion-report-'));
  try {
    const path = join(dir, 'report.json');
    writeFileSync(path, JSON.stringify(value));
    return spawnSync(process.execPath, ['.github/scripts/validate-motion-report.mjs', path], { encoding: 'utf8' });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test('accepts the eight configurations with finite measurements', () => assert.equal(validate(report()).status, 0));
test('rejects a duplicate configuration replacing another', () => { const r = report(); r.results[7] = r.results[0]; assert.notEqual(validate(r).status, 0); });
test('rejects absent or nonnumeric metrics', () => { const r = report(); r.results[0].longAnimationFrames.durationMs = null; assert.notEqual(validate(r).status, 0); });
test('rejects missing browser and incorrect CPU rate', () => { const r = report(); r.browser = ' '; assert.notEqual(validate(r).status, 0); r.browser = 'Chrome'; r.cpuThrottlingRate = 1; assert.notEqual(validate(r).status, 0); });
test('rejects a missing report', () => assert.notEqual(spawnSync(process.execPath, ['.github/scripts/validate-motion-report.mjs', '/no/such/report.json']).status, 0));
