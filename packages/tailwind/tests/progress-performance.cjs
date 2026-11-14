const { createRequire } = require('module');
const req = createRequire(process.cwd() + '/package.json');
const { build } = req('vite');
const { chromium } = req('playwright');
const { resolve } = require('path');
(async () => {
  const out = await build({
    configFile: false,
    logLevel: 'error',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    resolve: { conditions: ['development'] },
    build: {
      write: false,
      minify: false,
      lib: {
        entry: resolve('tests/progress-controller-entry.ts'),
        name: 'ProgressControllers',
        formats: ['iife'],
      },
    },
  });
  const script = (Array.isArray(out) ? out[0] : out).output.find(
    (x) => x.type === 'chunk',
  ).code;
  const browser = await chromium.launch({ headless: true });
  const repetitions = Number(process.env.PROGRESS_BENCH_REPETITIONS ?? 3);
  const durationMs = Number(process.env.PROGRESS_BENCH_DURATION_MS ?? 2500);
  if (!Number.isInteger(repetitions) || repetitions < 1 || !Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error('PROGRESS_BENCH_REPETITIONS and PROGRESS_BENCH_DURATION_MS must be positive');
  }
  console.log(JSON.stringify({ browser: browser.version(), repetitions, durationMs, warmupMs: 500, styles: 'inline only' }));
  for (let repetition = 0; repetition < repetitions; repetition++) {
   for (const count of (repetition % 2 ? [100, 20, 1, 0] : [0, 1, 20, 100])) {
    for (const instrumented of (repetition % 2 ? [true, false] : [false, true])) {
    const page = await browser.newPage({ reducedMotion: 'no-preference' });
    await page.setContent('<main></main>');
    await page.addScriptTag({ content: script });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    const result = await page.evaluate(async ({ count, instrumented, durationMs }) => {
      const main = document.querySelector('main');
      const api = window.ProgressControllers;
      for (let i = 0; i < count; i++) {
        const wrap = document.createElement('div');
        wrap.innerHTML =
          '<div style="display:flex;width:200px;height:4px"><div></div><div></div><div></div></div><svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" /></svg>';
        main.appendChild(wrap);
        const bars = wrap.querySelectorAll('div div');
        api.createLinearIndeterminateController({
          leadingBar: bars[0],
          gapTrack: bars[1],
          trailingBar: bars[2],
        });
        api.createCircularProgressController({
          svg: wrap.querySelector('svg'),
          circle: wrap.querySelector('circle'),
        });
      }
      await new Promise((r) => setTimeout(r, 500));
      let writes = 0,
        writeMs = 0;
      const original = CSSStyleDeclaration.prototype.setProperty;
      if (instrumented) CSSStyleDeclaration.prototype.setProperty = function (...args) {
        let t = performance.now();
        const result = original.apply(this, args);
        writeMs += performance.now() - t;
        writes++;
        return result;
      };
      const frames = [];
      let last = performance.now();
      const startTime = last;
      await new Promise((resolve) => {
        const start = last;
        function tick(t) {
          frames.push(t - last);
          last = t;
          if (t - start < durationMs) requestAnimationFrame(tick);
          else resolve();
        }
        requestAnimationFrame(tick);
      });
      CSSStyleDeclaration.prototype.setProperty = original;
      frames.sort((a, b) => a - b);
      return {
        count,
        instrumented,
        elapsedMs: last - startTime,
        frames: frames.length,
        medianMs: frames[Math.floor(frames.length * 0.5)],
        p95Ms: frames[Math.floor(frames.length * 0.95)],
        writes: instrumented ? writes : null,
        writeMs: instrumented ? writeMs : null,
      };
    }, { count, instrumented, durationMs });
    const metrics = await cdp.send('Performance.getMetrics');
    const selected = Object.fromEntries(metrics.metrics
      .filter(({ name }) => ['TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration'].includes(name))
      .map(({ name, value }) => [name, value]));
    console.log(JSON.stringify({ repetition, ...result, cdpSecondsSinceEnable: selected }));
    await page.close();
    }
   }
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
