# Motion Phase 3 F1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the researched M3 spring tokens as a tested, framework-independent F1 foundation.

**Architecture:** A pure token module owns the two global schemes, physical parameters and official web fallback values. `defineTokens` selects a scheme once. F1 remains incomplete until its shared model, generated `linear()`, providers, syntaxes and documentation are designed and implemented.

**Tech Stack:** TypeScript, Vitest, Vite.

**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` §§3, 5, 7, 8.1 quater–quinquies; `docs/motion/research/R17-m3-motion-tokens.md`.

## Global Constraints

- C1, C6, C12: framework-independent `@udixio/motion`; no framework context.
- C2, C16: anime.js is the only JS engine; providers remain replaceable.
- C3, C8, C13: prefer native and verify providers in Chromium, Firefox and WebKit.
- C11: public exports for functionality used by components.
- I22, I25: `defineTokens`; `spring.<speed>.<type>`; scheme global, default expressive, physical parameters retained.
- S1: generated `linear()` is the default native fallback; official Bézier is last resort. This tranche exposes the latter as data only and does not yet claim native fallback support.

## Review Focus

- Default scheme must be expressive: test default physical and fallback values.
- Standard spatial values differ but effects remain identical: test all six tokens in both schemes.
- A slow standard spatial fallback lasts 750 ms: test this exception.
- Repeated calls must not share mutable nested token data: test independent calls.
- Unknown scheme at runtime must fail rather than silently select a different one: test invalid input.

---

### Task 1: M3 spring token foundation

**Files:** Create `packages/motion/src/tokens.ts` and `packages/motion/src/tokens.spec.ts`; modify `packages/motion/src/index.ts` and `packages/motion/README.md`.

**Interfaces:** `defineTokens(options?: { scheme?: 'expressive' | 'standard' }): MotionTokens` and exported types `MotionTokens`, `MotionScheme`, `SpringToken`. Result `spring.fast|default|slow.spatial|effects` contains `dampingRatio`, `stiffness`, and `fallback: { duration, easing }`, with duration in milliseconds and easing as CSS cubic-bezier.

- [x] **Step 1:** Write failing tests covering every physical tuple and official fallback tuple from R17, default and invalid scheme, and independence of calls.
- [x] **Step 2:** Run `npx vitest run --project unit src/tokens.spec.ts` from `packages/motion`; expect failure because `defineTokens` is absent.
- [x] **Step 3:** Implement `defineTokens` and export its types and function; select scheme at definition time, return independent nested objects, reject invalid runtime scheme. Record Bézier strings and millisecond values exactly as R17.
- [x] **Step 4:** Document the API, units, official fallback limitation, and unfinished F1 scope in `packages/motion/README.md`.
- [x] **Step 5:** Verify the focused unit suite, `npx nx test @udixio/motion`, and package build; report environmental failures.
- [ ] **Step 6:** Commit only this plan and the listed files with `feat(motion): add M3 spring token foundation`.

## Execution ledger

- Ruling: limit this tranche to reviewed token data — B2/B3 and §8.4 remain unspecified; introducing provider and syntax contracts now would invent cross-family behavior. Cost: F1 is not yet delivered.
- Ruling: return fresh objects per call and reject invalid scheme — avoids cross-consumer mutation and silent fallback; no runtime global state is introduced.

- Verification: build passed; unit and Chromium/Firefox suite passed (88 tests). The complete three-browser run could not launch WebKit: system libraries `libevent-2.1-7t64` and `libmanette-0.2-0` are missing.
