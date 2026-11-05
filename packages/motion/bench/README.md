# Indicative motion benchmark

Build the package first (`npx nx build @udixio/motion`), install the Playwright Chromium browser, then run `pnpm --filter @udixio/motion bench`. The local Vite server serves the built providers and resolves their dependencies; the report is written to the ignored `bench/report.json`.

The report compares WAAPI and animejs providers, CSS transitions, and Motion's `animate`, each with 100 and 1000 elements in a fresh Chromium page with 4× CPU throttling. `scriptMs` measures synchronous animation setup, `longAnimationFrames` gives the count and total duration in milliseconds reported by Chromium's Long Animation Frames API, and `framesDropped` estimates missed 60 Hz frames from animation-frame intervals. Results depend on hardware, browser and environment; they are observational and have no pass/fail thresholds.
