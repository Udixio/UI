# Public API standard

Treat every public prop, input, output, method, slot, default, and type as a product contract. React
is the default implementation source, not an automatic design authority. Audit its contract before
copying anything to core, Angular, examples, or documentation.

## Review vocabulary before implementation

For every new or touched public member, verify that its name:

- expresses user intent or a domain concept rather than the current CSS, DOM, or implementation
  mechanism;
- describes the `true` state positively and reads naturally in both JSX and an Angular binding;
- avoids imperative toggles such as `enableX` or `disableX`, double negatives, and stale historical
  terminology, except established platform contracts such as `disabled`;
- remains accurate if internal markup, spacing, animation, or state ownership changes;
- uses one framework-neutral canonical concept while allowing idiomatic binding syntax such as
  React `onPressedChange` and Angular `pressedChange`;
- is consistent with neighboring stable components without copying an existing defect;
- has a predictable type, default, controlled/uncontrolled model, and event payload.

Examples: prefer an intent such as `edgeAligned` over a mechanism such as
`disableTextMargins`; prefer `compact` over `disableSpacing`. Do not mechanically apply these example
names: derive the exact concept from behavior, Material guidance, tests, and neighboring APIs.

Semantic review cannot be proven by a naming regex or generated documentation. The checker must
inspect source interfaces, adapter declarations, call sites, resolved styles, behavior, tests, and
future plausible implementations before accepting a name.

## Make proposals before synchronization

When a public name or contract is ambiguous, emit a blocking `API-DESIGN-<AREA>-NNN` finding before
editing adapters. Include:

1. the current contract and the intent inferred from evidence;
2. why the current name leaks an implementation detail, reads negatively, or will age poorly;
3. two or three viable names with their trade-offs;
4. one recommendation and React plus Angular usage examples;
5. compatibility, release, documentation, and migration impact.

Stop and request the user's choice when alternatives express materially different product intent.
Proceed without a choice only when one result is unambiguously required by an already approved,
stable repository convention. Never synchronize a questionable React name merely to obtain parity.

## Protect stability without preserving accidental debt

Determine whether the contract is unreleased, experimental, or stable from package versions,
release history, tags, changelogs, and repository policy.

- For unreleased work, correct a defective name at every source and call site now. Do not create a
  deprecated alias for code that has never shipped.
- For stable APIs, do not rename, remove, narrow, change defaults, or alter event semantics without
  explicit authorization and a release/migration plan.
- Do not add a compatibility alias by default. If released consumers require one, document its
  owner, target removal version, migration, tests, and deprecation message in the same change.
- Treat optional additions as API evolution that still requires design review, tests, and docs.

At the beginning and end of API work, compare the source interfaces and adapter declarations with
the chosen Git baseline. A diff is evidence to review, not permission to preserve a bad name or to
make a breaking change. Record the baseline ref and every accepted delta in the audit report.
