import { test } from 'node:test';
import assert from 'node:assert/strict';
import { motionBrowsers } from '../../packages/tailwind/tests/motion-browsers.mjs';

test('selects and trims requested browsers', () => {
  assert.deepEqual(motionBrowsers(' chromium, firefox '), ['chromium', 'firefox']);
  assert.deepEqual(motionBrowsers(undefined), ['chromium', 'firefox', 'webkit']);
});

test('rejects invalid, empty and duplicate browser selections', () => {
  for (const value of ['', 'chromium,', 'unknown', 'chromium,chromium']) {
    assert.throws(() => motionBrowsers(value), /MOTION_BROWSERS/);
  }
});
