import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, configFile: false, server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  const address = server.httpServer.address();
  browser = await chromium.launch({ headless: true });
  const results = [];
  for (const provider of ['waapi', 'animejs', 'css', 'motion']) {
    for (const elements of [100, 1000]) {
      const page = await browser.newPage();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.goto(`http://127.0.0.1:${address.port}/bench/page.html`);
      await page.waitForFunction(() => typeof window.runBenchmark === 'function');
      const metrics = await page.evaluate(({ provider, elements }) => window.runBenchmark(provider, elements), { provider, elements });
      results.push({ provider, elements, ...metrics });
      await page.close();
    }
  }
  const report = { generatedAt: new Date().toISOString(), browser: await browser.version(), cpuThrottlingRate: 4, results };
  await writeFile(new URL('report.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${results.length} configurations to bench/report.json`);
} finally {
  await browser?.close();
  await server.close();
}
