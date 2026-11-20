import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

// A plain page: no bundler, no `process`, the built package loaded through an import map.
const root = fileURLToPath(new URL('../', import.meta.url));
const engines = { chromium, firefox, webkit };
const browsers = (process.env.MOTION_BROWSERS ?? 'chromium,firefox,webkit').split(',').map((name) => name.trim());
const types = { '.js': 'text/javascript', '.css': 'text/css' };

const page = `<!doctype html>
<meta charset="utf-8">
<title>Plain page</title>
<script type="importmap">${JSON.stringify({
  imports: {
    '@udixio/motion': '/dist/index.js',
    '@udixio/motion/presets': '/dist/presets.js',
    '@udixio/motion/layout': '/dist/layout.js',
  },
})}</script>
<script type="module">
  import { connectMotion } from '@udixio/motion';
  import '@udixio/motion/presets';
  import '@udixio/motion/layout';
  connectMotion();
  window.connected = true;
  const card = document.createElement('p');
  card.id = 'card';
  card.dataset.motion = 'fade';
  card.textContent = 'Inserted after connect';
  document.body.append(card);
</script>
`;

/** Serves the page and the built files under dist/, and nothing else. */
function serve() {
  return new Promise((resolve) => {
    const server = createServer(async (request, response) => {
      const { pathname } = new URL(request.url, 'http://localhost');
      if (pathname === '/') {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end(page);
        return;
      }
      if (!pathname.startsWith('/dist/')) {
        response.writeHead(404).end();
        return;
      }
      try {
        const body = await readFile(join(root, decodeURIComponent(pathname)));
        response.writeHead(200, { 'content-type': types[extname(pathname)] ?? 'application/octet-stream' });
        response.end(body);
      } catch {
        response.writeHead(404).end();
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

for (const name of browsers) {
  test(`a plain page connects the built package and animates an inserted element (${name})`, { timeout: 90_000 }, async () => {
    const server = await serve();
    const browser = await engines[name].launch();
    try {
      const tab = await browser.newPage();
      const errors = [];
      tab.on('pageerror', (error) => errors.push(error.message));
      tab.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await tab.goto(`http://127.0.0.1:${server.address().port}/`);
      await tab.waitForFunction(() => window.connected === true, null, { timeout: 15_000 }).catch(() => {});
      assert.deepEqual(errors, [], 'no page error while the package loads and connects');
      assert.equal(await tab.evaluate(() => window.connected === true), true, 'connectMotion ran');
      await tab.waitForFunction(() => document.getElementById('card')?.getAnimations().length > 0, null, { timeout: 15_000 });
      assert.deepEqual(errors, [], 'no page error while the inserted element animates');
    } finally {
      await browser.close();
      server.close();
    }
  });
}
