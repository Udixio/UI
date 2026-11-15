import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ENGINES = ['udixio', 'animejs', 'none'];
const SCENARIOS = ['reorder', 'resize', 'idle'];
const COUNTS = [50, 200];
const USAGE = `Usage: node bench/layout-run.mjs [--engine ${ENGINES.join('|')}] [--scenario ${SCENARIOS.join('|')}] [--count ${COUNTS.join('|')}]
Without a filter, every configuration runs and bench/layout-report.json is written. With a filter, only the matching
configurations run and their results are printed; the report is left untouched.`;

/** The `--engine`, `--scenario` and `--count` filters, each optional, as `--name value` or `--name=value`. */
function filtersOf(argv) {
  const filters = {};
  for (let index = 0; index < argv.length; index++) {
    const match = /^--(engine|scenario|count)(?:=(.*))?$/.exec(argv[index]);
    if (!match) throw new Error(`Unknown argument "${argv[index]}".\n${USAGE}`);
    const value = match[2] ?? argv[++index];
    if (value === undefined) throw new Error(`${match[0]} needs a value.\n${USAGE}`);
    filters[match[1]] = value;
  }
  if (filters.engine !== undefined && !ENGINES.includes(filters.engine)) throw new Error(`Unknown engine "${filters.engine}".\n${USAGE}`);
  if (filters.scenario !== undefined && !SCENARIOS.includes(filters.scenario)) throw new Error(`Unknown scenario "${filters.scenario}".\n${USAGE}`);
  if (filters.count !== undefined) {
    filters.count = Number(filters.count);
    if (!COUNTS.includes(filters.count)) throw new Error(`Unknown count "${filters.count}".\n${USAGE}`);
  }
  return filters;
}

/** Every configuration of the report, in its order, that the filters keep. */
function configurationsOf(filters) {
  const configurations = [];
  for (const scenario of ['reorder', 'resize']) {
    for (const engine of ['udixio', 'animejs']) {
      for (const count of [50, 200]) configurations.push({ engine, scenario, count });
    }
  }
  for (const engine of ['udixio', 'animejs', 'none']) {
    for (const count of [50, 200]) configurations.push({ engine, scenario: 'idle', count });
  }
  return configurations.filter(
    ({ engine, scenario, count }) =>
      (filters.engine === undefined || filters.engine === engine) &&
      (filters.scenario === undefined || filters.scenario === scenario) &&
      (filters.count === undefined || filters.count === count),
  );
}

const filters = filtersOf(process.argv.slice(2));
const configurations = configurationsOf(filters);
const filtered = Object.keys(filters).length > 0;
if (configurations.length === 0) throw new Error(`No configuration matches the filters.\n${USAGE}`);

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
  if (filtered) {
    console.log(JSON.stringify(results, null, 2));
  } else {
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
  }
} finally {
  await browser?.close();
  await server.close();
}
