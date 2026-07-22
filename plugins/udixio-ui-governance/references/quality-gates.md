# Quality gates

Discover actual Nx targets and package scripts before running commands. Prefer the narrowest gate
that proves the change, then run integration gates for cross-package work.

## Required dimensions

1. Core pure behavior and DOM-controller unit tests.
2. React behavior tests and touched-file TypeScript diagnostics.
3. Angular behavior tests and Angular package compilation.
4. Equivalent controlled/uncontrolled, blocked, ARIA, keyboard, pointer, reduced-motion, and
   cleanup scenarios where applicable.
5. Documentation generation and a clean generated-API diff when docs, TSDoc, examples, exports, or
   public APIs change.
6. Documentation build and a rendered-page check for each available framework, including API tags.
7. Formatting and `git diff --check`.

Typical commands in this repository include:

```bash
pnpm nx test @udixio/core
pnpm nx test @udixio/ui-react
pnpm nx test ui-angular
pnpm nx build @udixio/core
pnpm nx build @udixio/ui-react
pnpm nx build ui-angular
pnpm --dir apps/doc docgen
pnpm --dir apps/doc docgen:check
python3 plugins/udixio-ui-governance/scripts/validate_api_docs.py --component <component>
pnpm --dir apps/doc build
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/tsc -p packages/ui-react/tsconfig.lib.json --noEmit
git diff --check
```

Run `docgen` before `docgen:check`. The check passes only when every versioned API artifact is
byte-for-byte current, including additions, removals, and renames. It compares generated content to
the worktree rather than to `HEAD`, so intentional uncommitted API updates remain valid and user
changes are not misattributed. Never discard changes to manufacture a pass.

For documentation/API changes, also verify deterministically that every generated file is valid
JSON, its declared available frameworks have non-empty corresponding payloads, and no duplicate
public member name exists within one framework member kind. Then exercise the built API route for
React and Angular where available and confirm that `@devx`, `@a11y`, and `@limitations` are visible,
not merely present in JSON. The browser/render check is required because extraction and rendering
are separate failure domains.

For the browser check, open `/components/<slug>/api` with a clean storage profile, select every
offered framework, and assert that the heading, member-table kind, adapter-only members, and all
three documentation-note sections change together. Reload and navigate through an API page that
lacks the preferred adapter: the stored preference must survive while the page falls back to a
framework it actually owns. Use `udixio:docs:preferred-example-framework` only to seed or inspect
the test profile; change the preference through the visible selector when validating interaction.

The normal gate validates every component touched by the change with one or more `--component`
arguments. Run `validate_api_docs.py --all` as an explicit repository-wide debt audit. Until legacy
components have migrated to complete TSDoc, findings from `--all` remain visible and actionable but
do not block an unrelated component repair; never use that policy to waive a touched component.

Do not launch dependent Nx builds concurrently when they share output directories. If the full
React typecheck contains known unrelated failures, capture the complete result, isolate diagnostics
for touched files, and never describe the full gate as passing.

## Definition of done

- A test reproduces every repaired behavior defect.
- Both adapters cover the same semantic scenario matrix.
- Public exports and package entry points resolve.
- Public TSDoc claims are supported by code/tests, generated data is fresh, and every non-empty API
  framework payload is reachable through the shared framework preference.
- No generated build output is committed unless the repository already versions it.
- No TODO, placeholder, ignored diagnostic, or undocumented waiver was introduced.
- The final report distinguishes verified passes, failures, warnings, and unexecuted gates.
