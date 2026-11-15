import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({
  root,
  configFile: false,
  server: { host: '127.0.0.1', port: 0 },
  // Pre-bundle anime.js before the first page load, so that no reload can interrupt a measurement.
  optimizeDeps: { include: ['animejs'] },
});
let browser;
try {
  await server.listen();
  const address = server.httpServer.address();
  browser = await chromium.launch({ headless: true });
  const configurations = [];
  for (const scenario of ['reorder', 'resize']) {
    for (const engine of ['udixio', 'animejs']) {
      for (const count of [50, 200]) configurations.push({ engine, scenario, count });
    }
  }
  for (const engine of ['udixio', 'animejs', 'none']) {
    for (const count of [50, 200]) configurations.push({ engine, scenario: 'idle', count });
  }
  const results = [];
  for (const { engine, scenario, count } of configurations) {
    const page = await browser.newPage();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(`http://127.0.0.1:${address.port}/bench/layout-page.html`);
    await page.waitForFunction(() => typeof window.runLayoutBenchmark === 'function');
    const metrics = await page.evaluate(
      ({ engine, scenario, count }) => window.runLayoutBenchmark(engine, scenario, count),
      { engine, scenario, count },
    );
    results.push({ engine, scenario, count, ...metrics });
    console.log(`${engine} ${scenario} ${count}: done`);
    await page.close();
  }
  const report = {
    generatedAt: new Date().toISOString(),
    browser: await browser.version(),
    cpuThrottlingRate: 4,
    runsPerConfiguration: 3,
    aggregation: 'median of the runs in one page; perRun keeps the raw values',
    timings: {
      udixio: 'motionManifest layout timing: spring.default.spatial (WAAPI, compositor)',
      animejs: 'createLayout defaults: duration 350 ms, ease inOut(3.5), no duration or ease passed',
    },
    results,
  };
  await writeFile(new URL('layout-report.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${results.length} configurations to bench/layout-report.json`);
} finally {
  await browser?.close();
  await server.close();
}
