# Public API standard

Treat every public prop, input, output, method, slot, default, and type as a product contract. React
is the default implementation source, not an automatic design authority. Audit its contract before
copying anything to core, Angular, examples, or documentation.

## Separate concept, vocabulary, and delivery shape

A public contract has three layers. Conflating them is what turns a faithful port into a bad API.

| Layer | Tooltip example | Cross-framework status |
| --- | --- | --- |
| Concept — the core interface | `variant`, `position`, `trigger`, `openDelay`, controlled `open` | Invariant. Identical everywhere. |
| Vocabulary — public names | `openChange` / `onOpenChange` | Invariant, apart from binding idiom. |
| Delivery shape — how a consumer reaches the concept | component `udx-tooltip` / directive `[udxTooltip]` / hook | Free per framework, chosen by idiom. |

A framework-specific mechanism is never a contract concept: `cloneElement`, `targetRef`, a
`RefObject`, render props, and `children` used as a trigger belong to React, not to the product.
Never promote one into core and never transliterate one into another adapter. Its counterpart is
the target framework's equivalent mechanism, not its transcription.

Angular's equivalent of a React component is not always a component. A directive attaches behavior
to a host the consumer already owns and injects its own `ElementRef`; a service fits behavior with
no host; a pipe fits a pure transformation. Choosing the shape is a design act that precedes
naming.

## Review vocabulary before implementation

For every new or touched public member, verify that its name:

- expresses user intent or a domain concept rather than the current CSS, DOM, or implementation
  mechanism;
- describes the `true` state positively and reads naturally in both JSX and an Angular binding;
- avoids imperative toggles such as `enableX` or `disableX`, double negatives, and stale historical
  terminology, except established platform contracts such as `disabled`;
- remains accurate if internal markup, spacing, animation, or state ownership changes;
- uses one framework-neutral canonical concept while allowing idiomatic binding syntax such as
  React `onPressedChange` and Angular `pressedChange`, and while allowing a different delivery
  shape as defined above — an attribute-selector directive may prefix its inputs when the host
  element is not its own, provided each prefixed input maps to one canonical concept;
- is consistent with neighboring stable components without copying an existing defect;
- has a predictable type, default, controlled/uncontrolled model, and event payload.

Examples: prefer an intent such as `edgeAligned` over a mechanism such as
`disableTextMargins`; prefer `compact` over `disableSpacing`. Do not mechanically apply these example
names: derive the exact concept from behavior, Material guidance, tests, and neighboring APIs.

Semantic review cannot be proven by a naming regex or generated documentation. The checker must
inspect source interfaces, adapter declarations, call sites, resolved styles, behavior, tests, and
future plausible implementations before accepting a name.

## Make proposals before synchronization

When a public name or contract is ambiguous, emit a blocking `API-DESIGN-NNN` finding before
editing adapters. Include:

1. the current contract and the intent inferred from evidence;
2. why the current name leaks an implementation detail, reads negatively, or will age poorly;
3. two or three viable names with their trade-offs;
4. one recommendation and React plus Angular usage examples;
5. compatibility, release, documentation, and migration impact.

Stop and request the user's choice when alternatives express materially different product intent.
Proceed without a choice only when one result is unambiguously required by an already approved,
stable repository convention. Never synchronize a questionable React name merely to obtain parity.

## Propose a delivery shape before adopting it

A shape that differs from the source adapter's is legitimate, but never silent. Before writing the
target adapter, emit a blocking `FORM-<AREA>-NNN` finding containing:

1. the source adapter's shape and the concept it serves;
2. the proposed shape for the target framework and the idiom that justifies it;
3. the invariants preserved — core contract, observable behavior, accessibility, styles, tests;
4. what the new shape can no longer express, or an evidence-backed statement that nothing is lost;
5. migration, documentation, and test impact.

Emit the finding, then stop and request the user's decision. Default severity is `major`; use
`blocker` when the current shape makes a primary interaction unreachable. Never adopt a different
shape merely because it is shorter, and never keep the source shape merely to make a parity table
line up.

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
