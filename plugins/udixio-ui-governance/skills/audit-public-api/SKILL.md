---
name: audit-public-api
description: Review, redesign, or validate the long-lived public contract of an Udixio component by judging core TypeScript interfaces, React props and callbacks, Angular inputs and outputs, defaults, types, naming, and release stability. Use before implementing, synchronizing, documenting, or declaring a component API stable.
---

# Audit the source public API

Apply [the audit contract](../../references/audit-contract.md) and
[the public API standard](../../references/public-api-standard.md). This is an AI semantic review of
source contracts. Do not infer API quality from generated documentation and do not replace judgment
with a naming regex.

## Inspect the real contract

Read the component's complete source slice:

1. shared core TypeScript interfaces, public types, resolved state, defaults, and exports;
2. React prop types, native-prop composition, destructuring defaults, callbacks, overloads, and
   public ref behavior;
3. Angular `input()`/`output()` declarations, aliases, transforms, defaults, content projection,
   and exported types;
4. styles and behavior that reveal what each public member actually controls;
5. tests, direct source examples, call sites, TSDoc, and migration history as supporting evidence.

Use generated API JSON only later to validate documentation extraction. Never use it as the source
or semantic validator of the component API.

## Judge for long-term use

For every public member, ask whether a developer can understand the intent without reading the
implementation and whether the contract remains truthful if markup, CSS, Motion, or internal state
changes. Review naming, polarity, type shape, defaults, optionality, event semantics, controlled
state, framework neutrality, composability, and consistency.

React is the default implementation source, not the design authority. Existing parity does not pass
this checker when both adapters expose the same weak contract. For example, `disableTextMargins`
must be challenged because it is negative and names a spacing mechanism rather than the user-facing
layout intent; inspect behavior before recommending the final replacement.

## Propose before changing

For every weak or ambiguous contract, emit a major `API-DESIGN-*` finding containing the current
usage, inferred intent, future maintenance risk, two or three alternatives with trade-offs, one
recommendation, React and Angular usage examples, and release/migration impact.

In `audit` or `validate`, report only. In `fix`, do not select among materially different product
meanings without the user's decision. Once resolved, update the canonical core contract, React,
Angular, tests, call sites, examples, TSDoc, and generated documentation as one coherent change.
Never add a deprecated alias for unreleased code. For a released stable API, require explicit
breaking-change authorization or a bounded, versioned migration plan.

## Verify stability

Determine maturity from versions, changelogs, tags, release history, and repository policy. Compare
the source interfaces and adapter declarations with the chosen Git baseline and inspect every added,
removed, renamed, retyped, re-defaulted, or behaviorally changed member. Record accepted changes in
the report. Stability is a semantic conclusion supported by source history and tests, not a clean
generated-file diff.
