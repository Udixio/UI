---
name: audit-accessibility
description: Audit, repair, or strictly validate accessibility for a Udixio React, Angular, or Svelte component, including native semantics, ARIA, keyboard and focus behavior, disabled/loading states, contrast, motion, touch targets, RTL, and cross-framework equivalence. Use for accessibility reviews, a11y regressions, WCAG checks, or accessible component implementation.
---

# Audit component accessibility

## Establish the contract

1. Select `audit`, `fix`, or `validate` from
   [the audit contract](../../references/audit-contract.md).
2. Read [accessibility-standard.md](../../references/accessibility-standard.md).
3. Identify the component's role, accessible name, values/states, keyboard model, focus behavior,
   and announcements before inspecting CSS details.
4. Browse current primary W3C, ARIA APG, Material, React, Angular, or Svelte sources for normative claims
   that are not already established by the repository.

## Inspect React first

- Trace every public state and action to the rendered native element or justified ARIA contract.
- Verify keyboard, pointer, focus-visible, loading, disabled, controlled/uncontrolled, and error
  paths from implementation and tests.
- Inspect DOM prop forwarding for invalid or leaked internal attributes.
- Verify animation, reduced-motion behavior, and state-layer geometry without relying on screenshots
  alone.
- Check token-resolved contrast when tooling is available; never infer it from semantic token names.

## Inspect each target adapter and parity

Repeat the rendered-DOM and interaction audit for Angular and for Svelte. In Angular, account for
component hosts, content projection, signal updates, event outputs, and cleanup. In Svelte, account
for the absence of a host element, rest-prop spreading of `aria-*` and native handlers onto the
root element, snippet-rendered content, `bind:` updates, and `$effect` cleanup. Require equivalent user semantics, not identical source
syntax. Document only differences imposed by the platform.

## Repair and validate

For `fix`, prefer native elements, repair the shared semantic contract before adapter work, and add
equivalent regression scenarios to every shipped adapter. Do not add redundant ARIA or hide focus.

Run focused behavior tests plus relevant gates from
[quality-gates.md](../../references/quality-gates.md). Automated tools supplement but do not replace
DOM and interaction inspection. Report each issue as `A11Y-<AREA>-NNN` with exact evidence.
