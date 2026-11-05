# Motion F1 document CSS implementation plan

> **For agentic workers:** Use superpowers:executing-plans.

**Goal:** Deliver the established motion scale as explicit document CSS, with typed registration and native reduced-motion default.
**Architecture:** A static public stylesheet is copied by Vite and exposed as `@udixio/motion/motion.css`; it registers an inherited number and supplies an unregistered fallback via `:root`. No runtime or provider is assumed.
**Tech Stack:** CSS, Vite, Vitest browser.
**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` §8.2.6; `docs/motion/research/S1-spike-rapport.md` Q1.

## Constraints and review focus

- Register at document level, not inside shadow roots; inherit scale into nested and shadow trees.
- Default scale 1; `prefers-reduced-motion: reduce` defaults to 0.
- Preserve plain custom property fallback if `@property` is unsupported; SSR requires no JS.
- Do not publish provisional distance or stagger values or invent provider behavior.
- Verify package export and built CSS; no automatic global CSS injection.

## Task: CSS entry

**Files:** `packages/motion/public/motion.css`, `packages/motion/package.json`, `packages/motion/README.md`, browser test.

- [x] Add browser tests for registration, inheritance, shadow roots, and reduced-motion rule; observe missing stylesheet failure.
- [x] Add static CSS entry and package export, document explicit document import and limitations.
- [x] Run browser and unit tests, build and inspect exported artifact; record unavailable browser dependencies.
- [x] Commit only task files.

Verification: build and 95 Chromium/Firefox tests pass; built CSS matches source, package self-reference resolves, and Node imports the package without DOM. WebKit remains unavailable because host dependencies are missing.
