# Quality gates

Discover actual Nx targets and package scripts before running commands. Prefer the narrowest gate
that proves the change, then run integration gates for cross-package work.

## Required dimensions

1. Core pure behavior and DOM-controller unit tests.
2. React behavior tests and touched-file TypeScript diagnostics.
3. Angular behavior tests and Angular package compilation.
4. Equivalent controlled/uncontrolled, blocked, ARIA, keyboard, pointer, reduced-motion, and
   cleanup scenarios where applicable.
5. Documentation build when docs, examples, exports, or public APIs change.
6. Formatting and `git diff --check`.

Typical commands in this repository include:

```bash
pnpm nx test @udixio/core
pnpm nx test @udixio/ui-react
pnpm nx test ui-angular
pnpm nx build @udixio/core
pnpm nx build @udixio/ui-react
pnpm nx build ui-angular
pnpm --dir apps/doc build
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/tsc -p packages/ui-react/tsconfig.lib.json --noEmit
git diff --check
```

Do not launch dependent Nx builds concurrently when they share output directories. If the full
React typecheck contains known unrelated failures, capture the complete result, isolate diagnostics
for touched files, and never describe the full gate as passing.

## Definition of done

- A test reproduces every repaired behavior defect.
- Both adapters cover the same semantic scenario matrix.
- Public exports and package entry points resolve.
- No generated build output is committed unless the repository already versions it.
- No TODO, placeholder, ignored diagnostic, or undocumented waiver was introduced.
- The final report distinguishes verified passes, failures, warnings, and unexecuted gates.
