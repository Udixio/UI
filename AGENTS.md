This repository is Udixio UI: a Material Design 3 component library with a framework-agnostic core (`@udixio/core`) and React, Angular and Svelte adapters, plus the theme engine (`@udixio/theme`), the Tailwind plugin (`@udixio/tailwind`), the animation package (`@udixio/motion`), icons, an MCP server, and the documentation site (`apps/doc`).

This file holds the repository's rules. An agent's own memory only holds temporary notes about work in progress: a lasting rule goes here. A folder with its own rules has its own `AGENTS.md` (`apps/doc`, `packages/ui-angular`).

## Code

- Follow SOLID. Keep each module to one responsibility, with clear interfaces between them.
- No hardcoded values, no shortcuts that leave technical debt: fix the cause, not the symptom.
- Prefer a breaking change now to debt later, but warn the maintainer before making one, unless they asked for it.
- Everything is public. Never narrow the exports "to simplify": anyone must be able to write their own variant, strategy or helper without copying sources. Mental load is reduced by removing duplicate concepts and by guiding in the docs, never by hiding capabilities.
- A component's behaviour, styles and contract live once in `@udixio/core`; the adapters stay thin and idiomatic. React is the reference adapter: Angular and Svelte follow it, and a component change keeps all three in parity (`docs/component-authoring.md`, `docs/component-behavior.md`).
- Style with Tailwind classes and the theme's tokens, never raw CSS files or hardcoded radii, spacings or colours. Only what has no utility goes in a Tailwind v4 `@utility` that reads the theme's variables.
- Animation: `@udixio/motion` and anime.js are the direction; the controllers still on Motion are legacy. Before adding, restoring or replacing an animation, ask the maintainer about the engine and the mechanism (a layout/FLIP or a plain tween).
- Colour rules in `@udixio/theme`: one continuous rule whose anchors are each justified, never two regimes glued at a threshold; no absolute thresholds on measures that depend on hue and tone. Tabulate a candidate rule on a fixed sample (extremes, tinted whites, pastels, saturated, greys) in both modes before implementing it.
- Short TSDoc; no comments narrating history.
- Format changed files with the repository's pinned Prettier (`pnpm exec prettier --write <files>`), not `pnpx`, which fetches another version.
- Everything in the repository is in English: code, comments, commit messages and docs. Only the conversation with the maintainer is in French.
- A change is finished when its tests pass, type checks add no error, it is formatted, the docs in `apps/doc` are up to date, and, for anything visual, it has been looked at in a browser (see "Checking").

## Working with the maintainer

- Talk to the maintainer in French.
- When a choice is open, recommend one option rather than listing several.
- Whenever you name a step of a sequence (a task of a plan, a wave, a fix round, a run), write its position as `<value>/<total>` (e.g. task 3/8, run 2/3). In nested sequences, give each level its own position, from the outermost (e.g. wave 2/3 · task 4/9); never merge two levels into one number.
- Chain the obvious next steps (spec, plan, code); stop only for a real decision or a permission.
- In a comparison of options, tag each claim [Doc] (checked in official docs), [Design] (our own choice), [Hyp] (assumption or estimate) or [Test] (needs a measure), and drop the arguments the maintainer has ruled out. Check a library's behaviour in its official docs, not from memory.
- The maintainer often lets the agent work alone: criticise your own visual result before handing it back rather than counting on their review.

## Checking

- Run the checks yourself rather than handing them back: start the doc site, look at the result in a browser (Playwright, or Chrome through the Claude extension), in light and dark, and with reduced motion when there is animation.
- Never claim "no regression" from tests and an HTTP 200 alone: client-only effects (indicators, focus, animation) never show in server output. After a redesign, diff the old style and behaviour files against the git baseline (`git show <ref>:<file>`) and read every conditional branch.
- Nothing type-checks `apps/doc` (see its `AGENTS.md`): after renaming or retyping a public prop, grep `apps/doc` for the old name.

## Tests

- Every feature is tested: unit tests for its logic, and a browser test for what a user sees or does with it.
- Test behaviour through the public interface. Replace with mocks or spies only what is outside the repository (network, clock, disk), never the project's own modules, so that a refactoring does not break tests whose behaviour did not change. This applies to new tests; existing ones are not rewritten for it.
- Run the tests once a coherent batch is finished, not after each edit: browser suites and Nx builds can saturate the machine. Run them in series (`--parallel=1` or 2), never two heavy suites at once, one browser test file at a time. Whoever writes the code writes its tests; the orchestrator decides when to run them.
- `nx run-many -t build` aborts with "The workspace is out of sync": pre-existing drift, see `packages/ui-angular/AGENTS.md`. Use `--skip-sync`; never run `nx sync` blindly.

## Git

- Several agents may work in this checkout at the same time, and the maintainer edits in it too. Never `git stash`, `git restore`, `git checkout -- <file>`, `git reset`, and never switch its branch: a modified file you did not write belongs to someone else, even if it looks like noise. To test a clean state, use a worktree; to compare with a reference, `git show <ref>:<file>`.
- Stage your own paths explicitly; never `git add -A` nor `git commit -a`.
- Commit messages follow Conventional Commits (they drive versioning and the changelog).
- Small changes are committed on the current branch. A large feature gets its own branch, in a worktree, named by its kind (`feat/*`, `fix/*`, `refactor/*`, `docs/*`, `chore/*`).
- Pull requests target `develop` (see `CONTRIBUTING.md`). Push only the branches the maintainer has allowed; check before each push that no sensitive or large file goes with it. Subagents never push.

## Subagents

Always set `model` and `effort` explicitly when dispatching a subagent:

- Implementation (writing code and tests from a brief or plan, fixes from review findings): Haiku, effort `high` to `max` depending on difficulty.
- Reviews (task reviews, re-reviews of fixes, final reviews) and similar checking work: Sonnet, effort `high`. A task review is for a task that carries logic or an interface; a mechanical task (a rename, wiring, docs) goes without one and is covered by the final review.
- Design decisions (approaches, architecture, interfaces, visual and motion design, and user-facing copy the spec does not fix): a Fable 5.2 subagent (`model: fable`), effort `medium`, and nobody else.
  - The orchestrator gives it the exact context the decision needs: the spec sections, the code paths, the constraints, and the maintainer's decisions so far.
  - The orchestrator keeps a real dialogue with it. It answers the designer's questions by message. It asks the maintainer what only they can settle, and sends their answer back. This goes on until the designer has decided.
  - Haiku implements from briefs in which every design choice is made. Sonnet reviews and flags; it does not redesign. An open design question found by either goes back to the designer.
- Advanced research, or hard problems that need deep reasoning (root-cause debugging across components): Opus, effort `medium`.
- Give each brief the rules it needs, every time: Udixio components for every control in the docs, Tailwind and theme tokens rather than raw CSS, the engine for animation. A rule stated only in an earlier wave's guide is not followed.
- Parallelise the writing, not the checks: independent tasks on disjoint files go to parallel subagents as soon as they are ready; they run at most a light type check and targeted tests, never a doc build or a full suite. Tasks that touch shared files are not parallelised.

Size a plan's tasks so that one implementer finishes each under 500k tokens of context. When an implementer hands back above it, its fix rounds go to a fresh implementer, given the brief, the report and the review findings, instead of resuming it.

## Docs

- `docs/component-authoring.md` is how a component is written across core and adapters, `docs/component-behavior.md` how its behaviour is shared, `docs/motion/` the animation package. Specs go in `docs/superpowers/specs/`, plans in `docs/superpowers/plans/`, reports in `docs/superpowers/reports/`.
- `apps/doc` documents the library for its users. Any change that adds or alters something a user sees or uses updates it, in the same change.
- The spec changes only when a decision it records changes.
