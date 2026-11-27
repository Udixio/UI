# Angular adapter

- The monorepo uses Nx's TypeScript solution setup (project references), which Angular's compiler does not support. This package overrides it in `tsconfig.json`: `baseUrl: "."`, `composite: false`, `emitDeclarationOnly: false` (without the last one ng-packagr fails with "Could not resolve entry module"). It also needs the only `paths` entry of `tsconfig.base.json`, kept relative. Do not remove these.
- `nx sync:check` reports stale references in `tsconfig.lib.json` to `packages/core` and `packages/icons/icons-rounded-400`. This is pre-existing: build and test with `--skip-sync`, and do not run `nx sync`, which would strip them. Fixing the drift is its own task.
- Generating code with `@nx/angular` needs `NX_IGNORE_UNSUPPORTED_TS_SETUP=true`; normal build, test and lint do not.
- Tests can run against the published `@udixio/core` instead of the workspace one when the link drifts: `pnpm install --frozen-lockfile` restores it.
- Follow the React adapter and the core contract; parity checks go through the `udixio-ui-governance` skills.
