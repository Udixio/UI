# Motion F1 analytical spring implementation plan

> **For agentic workers:** Use superpowers:executing-plans.

**Goal:** Provide accurate CSS `linear()` timing for each existing M3 spring.
**Architecture:** Derive the zero-velocity analytical response and its settling duration, then approximate it with adaptive stops. Preserve the official Bézier fallback.
**Tech Stack:** TypeScript, Vitest.
**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` §8.2.6 (diff b2676cba..a4c14d19).

## Constraints and review focus

- Error ≤ 0.002, 21–26 stops for all official springs in both schemes.
- Preserve overshoot, start, finite endpoint, independent instances and existing fallback.
- Do not adopt provisional distance or stagger values.
- CSS document properties need a delivery contract; do not invent one.

## Task: derive native spring timing

**Files:** `packages/motion/src/tokens.ts`, `tokens.spec.ts`, `README.md`.
**Interface:** `SpringToken.linear: { duration: number; easing: string }`, duration in ms.

- [x] Test every spring against its analytical response, including stop count.
- [x] Run the focused test and observe the missing timing failure.
- [x] Implement analytical response and adaptive sampling, retaining existing fallback.
- [x] Run focused tests, package test and build; record environmental blockers.
- [x] Document the API and remaining F1 scope; commit only task files.

Verification: focused unit test and build pass; 90 tests pass with Chromium and Firefox. Full suite cannot launch WebKit because libevent-2.1-7t64 and libmanette-0.2-0 are missing. CSS registration remains outside this tranche.
