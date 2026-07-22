# Audit contract

Use this contract for every checker so findings remain comparable and actionable.

## Actions

- `audit`: inspect and report evidence; do not mutate files.
- `fix`: audit, repair verified findings in scope, then run proportional validation.
- `validate`: run the strict acceptance gates on the current implementation; do not broaden scope.
- `sync`: reconcile a target adapter from the source contract, then validate parity.
- `create`: implement the complete cross-framework slice and all acceptance artifacts.

Infer the action from the request. Default to `audit` for review language and `fix` for explicit
change language. Never turn an audit request into writes.

## Finding shape

Give every finding a stable identifier: `<CHECKER>-<AREA>-<NNN>`, for example
`PARITY-API-001`. Include:

1. severity and confidence;
2. exact evidence with file and line;
3. expected contract and actual behavior;
4. user-visible or maintenance impact;
5. smallest durable remediation;
6. disposition: `open`, `fixed`, or `accepted`;
7. validation that proves the disposition.

## Severity

- `blocker`: broken build, inaccessible primary interaction, data/state corruption, or missing
  framework implementation for a public component.
- `major`: public API, semantics, state, visual behavior, or documentation materially diverges.
- `minor`: convention, maintainability, or secondary UX defect with bounded impact.
- `info`: evidence-backed improvement that is not a defect.

Do not inflate severity. Absence of evidence is not a pass.

## Acceptance policy

- React is the default source adapter. Shared contracts, styles, behavior, and DOM controllers in
  core outrank framework implementation details.
- An intentional framework difference must have a platform reason, a test, and documentation.
- Never accept silent duplication, `any`, disabled lint rules, skipped tests, compatibility shims
  without removal criteria, or a second animation/state engine as a fix.
- Preserve unrelated user changes and existing public compatibility unless the task explicitly
  authorizes a breaking change.
- Close with: scope inspected, findings ordered by severity, changes made, validation commands and
  results, remaining risks, and documented exceptions.
