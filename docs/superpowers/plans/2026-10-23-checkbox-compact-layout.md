# Checkbox Compact Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep Checkbox's existing 16px visual appearance and 40px interaction surface while making only the layout footprint compact.

**Architecture:** The Core checkbox style owns the geometry. The root becomes a 16px layout box; the native input and state layer remain absolutely centered 40px surfaces, and the root paints the focus ring around that same 40px area. React, Angular, and Svelte only render the same structure.

**Tech Stack:** TypeScript, Tailwind class computation in `@udixio/core`, React Testing Library, Angular TestBed, Svelte Testing Library, Vitest/Jest, Nx.

**Spec:** `docs/superpowers/specs/2026-10-23-checkbox-compact-layout-design.md`

## Global Constraints

- Preserve the existing visual box, icon, colors, state behavior, and 40px target.
- Do not add a public `edgeAligned` prop or internal negative margins.
- Keep Core as the single owner of geometry and keep React/Angular/Svelte behavior equivalent.
- Preserve unrelated existing worktree changes.

## Review Focus

- The root must occupy 16px in layout while the input and state layer remain 40px and centered.
- Focus-visible feedback must still cover the 40px interaction surface, not shrink to 16px.
- The visual box and icon must remain size-4 and unchanged.
- Pointer activation must still reach the shared state-layer controller through the overflowing input.
- External margin styles/classes must apply to the compact root without being cancelled by component margins.

### Task 1: Lock the shared checkbox geometry

**Files:**

- Modify: `packages/core/src/lib/styles/checkbox.style.ts`
- Test: `packages/core/src/lib/styles/checkbox.style.spec.ts`

- [x] Write a failing style test asserting `checkbox` uses `size-4`, `input` uses a centered `size-10` surface, `stateLayer` uses the same centered `size-10` surface, the visual box remains `size-4`, and the focus pseudo-surface is `size-10`.
- [x] Run the focused Core style test and confirm it fails because the current root is `size-10` and the input/state layer fill the root.
- [x] Update the pure Core style only: compact the root, center the input and state layer at `size-10`, and move the focus outline to a centered 40px pseudo-surface; leave box/icon state classes unchanged.
- [x] Re-run the focused Core style test and confirm it passes.

### Task 2: Synchronize React, Angular, and Svelte markup contracts

**Files:**

- Modify: `packages/ui-react/src/lib/components/Checkbox.tsx`
- Modify: `packages/ui-angular/src/lib/checkbox/checkbox.ts`
- Modify: `packages/ui-svelte/src/lib/checkbox/Checkbox.svelte`
- Test: `packages/ui-react/src/tests/Checkbox.spec.tsx`
- Test: `packages/ui-angular/src/lib/checkbox/checkbox.spec.ts`
- Test: `packages/ui-svelte/src/lib/checkbox/checkbox.spec.ts`

- [x] Add equivalent failing adapter assertions for the compact root, centered 40px input/state layer, unchanged visual box, and margin-safe root styling.
- [x] Run the three focused adapter tests and confirm the new geometry assertions fail before markup changes.
- [x] Keep the existing DOM contract where possible; the adapters already render the Core-computed geometry, so no adapter templates required changes.
- [x] Run the three focused adapter tests and confirm they pass without changing state/event semantics.

### Task 3: Run cross-framework verification

**Files:**

- No additional source files expected.

- [x] Run Core, React, Angular, and Svelte Checkbox tests.
- [x] Run React type diagnostics, Angular build, Svelte typecheck/build, and `git diff --check`.
- [x] Review the final diff for unrelated changes and report any pre-existing worktree modifications separately.
