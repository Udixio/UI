# @udixio/motion step 3/8: the C1 spike and gate 1/3

Date: 2026-11-28. Spec: `docs/superpowers/specs/2026-11-28-motion-step3-slice-design.md` §4.3. Plan:
`docs/superpowers/plans/2026-11-28-motion-step3-slice.md`, Task 2/35. Harness:
`packages/motion/src/spike/c1-channels.browser.spec.ts` (commits `64d3af68`, `329fc271`), run alone in each engine, in series
(`MOTION_BROWSERS=<engine> npx vitest run --project browser src/spike/c1-channels.browser.spec.ts`, vitest 4.1.11).

Tags: [Doc] read in an official source or in the code; [Test] read in these runs; [Hyp] an assumption; [Design] a choice.

## 1. The verdict (gate 1/3), confirmed by the re-check (§9)

| Variable (plan, Task 2/35) | Value                                                               | Ground                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `HOLD_MODE`                | `'filling'`                                                         | The inline hold (S 10/10 a) fails in Firefox and WebKit, both orders, all six variants, in both runs; the filling hold passes all six variants in Firefox and WebKit (§9.2) [Test]               |
| `LIVE_END`                 | `true`                                                              | S 3/10 (a) and (b) pass in the three engines, in both runs [Test]                                                                                                                                |
| `RETURN_TO_REST`           | `'live-end'`                                                        | The release of a filling hold (cancel, one keyframe at `offset: 0`, same task) starts no author transition, does not jump, matches its twin and ends at rest in Firefox and WebKit (§9.2) [Test] |
| `HOLD_ABOVE_DRIVER`        | `'filling'`                                                         | S 5/10 passes in the three engines [Test]                                                                                                                                                        |
| `VIEW_TIMELINE_LIVE_END`   | chromium `true`, webkit `true`, firefox `'unsupported'` (JS driver) | S 3/10 (d) passes where `ViewTimeline` exists; Firefox has none [Test]                                                                                                                           |

- The decision of spec §4.2 (whole now, split through four registered custom properties at step 4/8) **stands**: S 1/10,
  S 2/10, S 4/10, S 6/10 and S 9/10 pass in the three engines; neither fallback 1 nor fallback 2 is triggered [Test].
- **Nothing stops the plan by the plan's own rule** (Task 2/35 Step 5: a failed S 1/10 or fallback 2).
- **S 3/10 (c) in Firefox** has no rule in the spec. The re-check shows that Firefox follows a changed rest **two frames
  late**, not never (§9.1). It goes to the designer as question 1/3 (§7), with a recommendation that changes no variable.
- **S 8/10 was not done** (the manual DevTools trace): fact 8 of spec §4.1 stays [Hyp]. It gates nothing in step 3/8
  (the split is built at step 4/8) but must be done before step 4/8 writes `channel-split.ts`.

## 2. The table, case by engine

Chromium: 18 passed, 1 skipped (S 8/10). Firefox: 10 passed, 8 failed, 1 skipped. WebKit: 12 passed, 6 failed, 1 skipped
[Test: the three run logs].

| Case                                                                                                  | Chromium                                                                                                   | Firefox                                                                                               | WebKit                                                                        |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| S 1/10 two `replace` on `translate`                                                                   | pass: `0px 20px`                                                                                           | pass: `0px 20px`                                                                                      | pass: `0px 20px`                                                              |
| S 2/10 one custom property per axis (px, % on x, scale pair; 25/50/75 %)                              | pass: every read equals its reference (e.g. at 50 %: `[50, 16.2407]`, `[-75, 16.2407]`, `[1.5, 0.837593]`) | pass: identical values                                                                                | pass: identical within tolerance                                              |
| S 3/10 (a) live end above a lower `scale` sought further                                              | pass: 5 rows value = expected (e.g. p 0.5, underlying 1.8: 1.5), after cancel 1.8                          | pass: same values                                                                                     | pass: same values                                                             |
| S 3/10 (b) the same on `--udx-motion-axis-x`                                                          | pass: e.g. p 0.5, underlying 80: 46; after cancel 80                                                       | pass: same                                                                                            | pass: same                                                                    |
| S 3/10 (c) stylesheet rest changed by a class at p 0.5 (1.1 → 1.5, held start 1.3)                    | pass: before 1.2, after 1.4, end 1.5, after cancel 1.5                                                     | **fail**: before 1.2, **after 1.2** (expected 1.4), **end 1.1** (expected 1.5), after cancel 1.5      | pass: 1.2, 1.4, 1.5, 1.5                                                      |
| S 3/10 (d) above a `ViewTimeline` driver, scrolled by script                                          | pass: 4 rows value = expected (1.1, 1.2667, 1.4333, 1.6), end 2, after cancel 2                            | no `ViewTimeline`: recorded `unsupported`, nothing asserted                                           | pass: same values as Chromium                                                 |
| S 4/10 whole to split at about 40 %                                                                   | pass: switch at 0.4166, before = after `[83.32, 41.66]`, deviations all 0                                  | pass: switch at 0.4001, before `[80.0224, 40.0112]` after `[80.0264, 40.0132]`, deviations ≤ 0.004 px | pass: switch at 0.418, before = after, deviations ≤ 0.2 px                    |
| S 5/10 zero-duration hold above a paused driver, both recreated in one task                           | pass: 21 reads at 50 px, `replaceState` `active`                                                           | pass: same                                                                                            | pass: same                                                                    |
| S 6/10 second registration; unregistered property                                                     | pass: `InvalidModificationError`; registered 50px at 50 %; unregistered 0px at 25 %, 100px at 75 %         | pass: same                                                                                            | pass: same                                                                    |
| S 7/10 `composite: 'add'`                                                                             | see §2.1                                                                                                   | see §2.1                                                                                              | see §2.1                                                                      |
| S 8/10 compositor (manual)                                                                            | **not done**                                                                                               | —                                                                                                     | —                                                                             |
| S 9/10 first frame, delay 200 ms                                                                      | pass: 12 frames in the delay, all opacity 0 and axis y 24px                                                | pass: 11 frames in the delay, all 0 and 24px                                                          | pass                                                                          |
| S 10/10 (a) inline hold, `transition: scale 200ms`                                                    | pass, both orders: 20 × 1.04, 0 `CSSTransition`                                                            | **fail**, both orders: reads 1 → 1.04 over 12 frames, `CSSTransition` seen in 12 reads                | **fail**, both orders: 1 → 1.04 over 6 frames, 7 reads with a `CSSTransition` |
| S 10/10 (a) Tailwind 4.3.3 `transition-[translate,scale,rotate]`                                      | pass, both orders                                                                                          | **fail**, both orders (9 and 10 reads with a transition)                                              | **fail**, both orders (5 each)                                                |
| S 10/10 (a) `transition: all 200ms`                                                                   | pass, both orders                                                                                          | **fail**, both orders (13, 12)                                                                        | **fail**, both orders (7, 7)                                                  |
| S 10/10 (c) `translate`, rest `-50% 0px`, held `-50% 4px`: `transition: translate` / Tailwind / `all` | pass, all three, both orders                                                                               | **fail**, all three, both orders: y reads 0 → 4 over about 12 frames                                  | **fail**, all three, both orders: y 0 → 4 over about 6 frames                 |
| S 10/10 (b) the return (inline removed + one keyframe at `offset: 0`)                                 | in range, no jump, ends at rest, nothing left (12 runs)                                                    | the same in every run, although (a) failed (12 runs)                                                  | the same in every run (12 runs)                                               |
| S 10/10 control: an inline change under `transition: scale 200ms`                                     | pass: 1.0029 → 1.04, a `CSSTransition` in 11 reads                                                         | **fail**: 1.04 from the first read, 0 transitions (§3)                                                | pass: 1.0087 → 1.04, a `CSSTransition` in 6 reads                             |

### 2.1 S 7/10, the three sums of `composite: 'add'`

| Sum                                      | Chromium   | Firefox    | WebKit     |
| ---------------------------------------- | ---------- | ---------- | ---------- |
| `translate: 10px 0px` added to `0px 5px` | `10px 5px` | `10px 5px` | `10px 5px` |
| `translate: 0px 5px` added to `-50% 0px` | `-50% 5px` | `-50% 5px` | `-50% 5px` |
| `scale: 1.5` added to `2`                | `3`        | `3`        | `3`        |

The same per-axis sum for `translate` and one rule for `scale` (a product) in the three engines [Test]: fallback 1 would
exist if it were ever needed. It is not needed now.

### 2.2 S 8/10

Not done by the controller. Fact 8 ("a `translate` or `scale` animation with `replace` can run on the compositor; a custom
property or another composite operation cannot") stays [Hyp]. Its only consequence is the accepted cost of split mode
(spec §4.2), which is built at step 4/8: the trace must be read before that step starts.

## 3. Firefox and the S 10/10 detector

**The detector is not blind in Firefox; the control started no transition at all.** [Test]

- In all six variants, Firefox's `getAnimations()` listed a `CSSTransition` in 9 to 13 of the 20 reads, exactly the reads
  where the value was still moving from 1 to 1.04 (or y from 0 to 4). The detector sees Firefox's transitions.
- In the control, Firefox read 1.04 from the first frame on, with 0 transitions: if a transition had run unseen, the scale
  would still have read below 1.04 in the first frames. Nothing ran.
- `getAnimations()` returns "CSS Animations, CSS Transitions, and Web Animations", and `CSSTransition` is Baseline widely
  available since July 2020 [Doc: MDN, `Element.getAnimations()`, `CSSTransition`].
- The likely cause [Hyp, consistent with Doc]: the control inserts the box, waits one `requestAnimationFrame` and writes
  the inline value. No style of the box is read in between, and Firefox runs the frame callbacks before its style flush,
  so no style change event has seen the box when the write lands. CSS Transitions 1 does not start a transition for an
  element that "was not in the document during the previous" style change event [Doc: CSS Transitions 1, §3 "Starting
  of transitions"]. In the variants the box had been animated for 200 ms first, so its style existed.

**So S 10/10 is conclusive in Firefox: (a) fails in both orders** [Test]. Even if it were not, WebKit alone triggers the
fallback (spec: "fails in an engine, in both orders").

**What the failure is** [Test]: in Firefox and WebKit, writing the held value inline and cancelling the animation (either
order) starts the author's transition **from the rest value**, not from the held one (the first read is 1, or y 0): the
before-change style there does not include the finished, filling animation, while Chromium's does. This is exactly the
replay from rest that review 12 (B2) feared.

**Harness change that makes the control conclusive in Firefox** (applied in `25bff1eb`; confirmed, §9.2):

1. In `it('control: …')`, right after `const element = box('spike-s10-scale');`, force a style computation with the element
   in the document: `read(element, 'scale');`, then keep `await nextFrame();`.
2. Add a second detector independent of `getAnimations()`: before the inline write,
   `let runs = 0; element.addEventListener('transitionrun', () => runs++);`, record `runs`, and assert
   `runs > 0 || samples.some(…transitions > 0)`. `transitionrun` fires when a transition is created, before any delay,
   Baseline widely available since March 2020 [Doc: MDN, `transitionrun` event]. The same counter can be added to
   `holdThenReturn` and recorded beside `transitions`.

Expected result [Hyp]: the control passes in Firefox, and nothing else changes, since the variants already see the
transitions.

## 4. S 3/10 (c) in Firefox

**What was read** [Test]: a paused one-keyframe animation (`scale: 1.3`, `offset: 0`) sought to 0.5 above a rest of 1.1;
the class is changed to a rest of 1.5 in the same task. Chromium and WebKit read 1.4 (the mix with the new rest), then 1.5
at the end. Firefox reads 1.2 (the mix with the old rest) and 1.1 at the end, while the underlying value read without the
effect is already 1.5. After the cancel it reads 1.5: **a jump of the size of the rest change at the end of the return**.

**Where it is narrower than (a) and (b)** [Test]: the live end follows a lower _animation_ in Firefox (a, b pass); it is
the _stylesheet_ rest that Firefox does not re-read for the implicit end keyframe, at least within the task and while
paused. Whether it re-reads it on the next frame of a running animation is not known [Hyp]: the harness reads in the same
task, paused.

**What the spec says**: the rule "S 2/10, S 3/10 (a, b, c), … pass in the three engines: the decision of §4.2 stands"
lists (c); the fallbacks name S 3/10 (a) or (b) (explicit transition to the value read, model §3.5 sentence on drivers
amended) and (d) only (JS driver). **There is no prescribed fallback for (c).** It does not touch the split mechanism
(fallbacks 1 and 2 are triggered by S 2, 4, 9 only), so §4.2 stands. It does touch the model §3.5 sentence "Same
mechanism for a return to rest", whose check at step 3/8 it is.

**Recommendation for the designer** [Design, to be confirmed] (the re-check of point 1 is done: §9.1, and §7 question 1/3 supersedes point 2):

1. Re-check first, cheaply: a variant (c') that, after `element.className = 'spike-rest-b'`, awaits one then two frames
   before reading (`after` and `end`), and a variant (c'') with the hold running in real time (not paused). If Firefox
   follows the new rest after a frame, (c) is a same-task artefact of no consequence for the registry, which never reads
   in the task where a class changes.
2. If it still fails: keep `LIVE_END = true` in every engine and write the Firefox cost. The spec's fallback for (a, b)
   (aim at the value read when the return starts) would give the very same jump at the end, so it buys nothing here.
   Amend the model §3.5 sentence on the return to rest: "In Firefox, a rest that the stylesheet changes during a return
   (a class, a breakpoint, a `:hover` rule) is reached by a jump at the return's end." Add it to the docs' costs (Task
   31/35).

## 5. Applying the decision rules of spec §4.3

| Case            | Verdict                                                                   | Rule applied                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S 1/10          | pass ×3                                                                   | Fact 2 holds; the mechanism is needed.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| S 2/10          | pass ×3                                                                   | Split by custom properties works (built at step 4/8).                                                                                                                                                                                                                                                                                                                                                                                                                               |
| S 3/10 (a), (b) | pass ×3                                                                   | `LIVE_END = true`; no amendment of the model's sentence on drivers.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| S 3/10 (c)      | pass Chromium, WebKit; **fail Firefox**                                   | No rule: designer (§4).                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| S 3/10 (d)      | pass Chromium, WebKit; Firefox has no `ViewTimeline`                      | Firefox's scroll driver uses its JavaScript implementation, which is what "(d) fails" would prescribe anyway.                                                                                                                                                                                                                                                                                                                                                                       |
| S 4/10          | pass ×3                                                                   | No fallback 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| S 5/10          | pass ×3                                                                   | `HOLD_ABOVE_DRIVER = 'filling'`; not `'stop-driver'`.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| S 6/10          | pass ×3                                                                   | `InvalidModificationError` is the "another copy registered it" signal; a non-interpolating custom property detects a missing registration.                                                                                                                                                                                                                                                                                                                                          |
| S 7/10          | recorded                                                                  | Fallback 1 would exist (same sums in the three engines).                                                                                                                                                                                                                                                                                                                                                                                                                            |
| S 8/10          | **not done**                                                              | Fact 8 stays [Hyp]; to do before step 4/8.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| S 9/10          | pass ×3                                                                   | No fallback 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| S 10/10 (a)     | pass Chromium; **fail Firefox and WebKit, both orders, all six variants** | "A hold is an inline value" is **dropped, before `claims.ts` is written**: every hold is the filling animation of §3.4 point 3 (zero duration, `fill: 'forwards'`, kept with `persist()`, created again above whatever is created under it). Its costs go in the docs: one animation alive per held property; an author's inline style on a held property is hidden while the state holds. Not chosen: neutralising the author's `transition`. No order passes, so no "order rule". |
| S 10/10 (b)     | no failure observed                                                       | `RETURN_TO_REST = 'live-end'` (§5.3).                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### 5.1 Does a failure reopen the model §3.5 and go back to the designer?

- By the spec and the plan, **no**: that happens for a failed S 1/10 or fallback 2 only. The S 10/10 fallback is
  prescribed by the spec and applied by the controller.
- But two points are not settled by the spec text and need the designer before Task 8/35 (§7): S 3/10 (c), and how far
  "every hold" reaches (kept frames, the exit hold, a hold while a layout flight runs). The model §3.5 and its glossary say
  a kept frame is "left inline" and that a state that stops removes "the inline value": wording to amend once the designer
  has ruled, not a reopened model [Hyp: my reading; the designer decides].

### 5.2 What `HOLD_MODE = 'filling'` implies for the registry [Design, derived from spec §3.4 and §4.3]

- A hold is the transition's end kept as a zero-duration `fill: 'forwards'` animation, `persist()`ed (fact 7: a filling
  animation that a later one overrides is removed otherwise [Doc: MDN]), never an inline value. The element's base style
  is never written by a state, so no author transition can start.
- §3.4's "a property has one inline value and at most one registry transition" becomes "a property has at most one
  registry hold animation and one registry transition". A claim that starts above a held lower state reads the current
  value, records the lower one as covered with its frame and cancels its hold animation, as it already does for a
  transition (I1). [Design, to confirm with the designer]
- Point 3 of §3.4 stops being an exception: the representation is the same everywhere; what stays specific to a hold
  above a driver or a legacy animation is "created again above it, in the same task, when it is created again".
- `detach`, `revert`, O1: "nothing inline, no animation" is unchanged; it now means the hold animations are cancelled.

### 5.3 Why `RETURN_TO_REST = 'live-end'`

- The (b) fallback exists for an inline value whose removal would start the author's transition. Under `'filling'` the
  return cancels the hold animation and starts the one-keyframe return in the same task; the base style does not change.
- Data: in all 36 returns (three engines, six variants, two orders), even where an inline value was removed under an
  author transition, the path stayed in range, linear, with no jump, ended at rest, and left no animation [Test]. A
  transition started underneath would have bent the live path; none did.
- Not tested by the spike [Hyp]: the release of a _filling_ hold (cancel it, start the live-end return, same task) with an
  author transition on the element. Task 8/35's hold test and Task 19/35's A8 check it in three engines; a spike variant
  before Task 8/35 would settle it earlier (§8).

## 6. What changes in the tasks

The plan pastes the five variables into Tasks 8/35, 9/35, 10/35, 18/35, 19/35 and 27/35. Tasks 13/35, 14/35, 16/35, 22/35
and 25/35 carry "inline" wording too and need the same paste.

| Task                               | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8/35 (registry a)                  | `HOLD_MODE = 'filling'`. Test `a hold reaches its frame and leaves it as HOLD_MODE says`: 20 frames at 1.04; inline `scale` **empty**; `getAnimations()` = one registry animation (`playState` `finished`, `fill` `forwards`, `replaceState` `active`) and no `CSSTransition`; add a variant with `transition: scale 200ms` on the `article`. `a release returns to rest with no end keyframe` unchanged (`LIVE_END`, `RETURN_TO_REST = 'live-end'`). Step 3's "at most one inline value and one registry transition" becomes §5.2's rule. Brief also gets the S 3/10 (c) ruling. |
| 9/35 (registry b)                  | The exit's `'hold'` (level 9) is a filling animation. `'keep'` follows the designer's ruling on kept frames (§7, question 2): if filling, `keep leaves the last keyframe as a kept frame` reads the value with nothing inline; if inline, a kept frame is the one inline value the registry writes. I5: the kept frame recorded as data, unchanged.                                                                                                                                                                                                                               |
| 10/35 (registry c)                 | `HOLD_ABOVE_DRIVER = 'filling'` (the plan's first variant; `'stop-driver'` is not used). `LIVE_END = true` for `a hand-back to a driver ends on its live value`. The filling hold above a driver is now the general hold plus "created again in the same task".                                                                                                                                                                                                                                                                                                                   |
| 13/35 (manual play)                | C3 says `play({ keyframes: { x: 100 } })` "leaves `translate: 100px 0px` inline": rewrite per the kept-frame ruling (filling: computed `100px 0px`, nothing inline, one animation; `detach()` cancels it).                                                                                                                                                                                                                                                                                                                                                                        |
| 14/35 (presence)                   | P2: "its last keyframe read after it ends" through a filling animation; "once `hidden`, nothing inline" plus "no animation". I5: twenty frames of the exit's last keyframe from the filling hold.                                                                                                                                                                                                                                                                                                                                                                                 |
| 16/35 (hover, press)               | A1: drop "(inline `1.04` when `HOLD_MODE` is `inline`)"; keep "at the end inline `scale` empty and `getAnimations()` empty".                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 18/35 (scroll)                     | `VIEW_TIMELINE_LIVE_END`: native in Chromium and WebKit; Firefox has no `ViewTimeline` and uses the JS driver. A hover above the driver: filling (already the case).                                                                                                                                                                                                                                                                                                                                                                                                              |
| 19/35 (interruptions, transitions) | A7: replace "the inline value while held is `-50% -2px`" by the computed value `-50% -2px` with nothing inline. A8 becomes the regression test of this verdict, in three engines (it fails in Firefox and WebKit with an inline hold [Test]). C2 follows the kept-frame ruling.                                                                                                                                                                                                                                                                                                   |
| 20/35 (legacy)                     | X5 unchanged (a legacy end stays inline by `restingFields`, spec §5.2). §5.2's "writes that claim's hold again (the legacy release may have removed it)": a legacy release removes inline values only, so a persisted filling hold survives it; the step becomes "check the hold is still the top, create it again above the legacy animation if it was created under it".                                                                                                                                                                                                        |
| 22/35 (HTML) and 25/35 (React)     | A3's "A1's four holds" inherits A1's new wording (no inline assert).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 23/35 (inspect, revert)            | `revert` must cancel the hold animations; the test's "nothing inline, no animation" already covers it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 27/35 (layout)                     | "A hold or release applied at once while flying" = a zero-duration filling hold created at once; the flight, created after it, overrides it and would remove it without `persist()` [Hyp, fact 7]: the hold must be persisted and visible again when the flight ends.                                                                                                                                                                                                                                                                                                             |
| 31/35 (docs)                       | Write the two costs of spec §4.3 (one animation per held property; an author's inline style on a held property hidden while it holds), and the Firefox cost of S 3/10 (c) if it is confirmed.                                                                                                                                                                                                                                                                                                                                                                                     |
| 2/35 Step 5                        | Move the fact cases to `src/engine-facts.browser.spec.ts`: S 1, S 3 (a, b, d), S 5, S 6, S 7, S 9 as they are; S 10/10 as the fact behind `'filling'` (the inline hold replays the author's transition in Firefox and WebKit); S 3 (c) after its re-check. Delete `src/spike/` only after the re-checks of §8. S 2 and S 4 stay with `channel-split.ts` at step 4/8.                                                                                                                                                                                                              |
| Spec and model                     | Spec §3.4 point 2 ("a hold is an inline value"), §7 A1 ("the inline `scale` is `1.04`"), C3 ("inline"), §12's registry bullet; model §3.5 and glossary "kept frame … left inline", if the designer extends filling to kept frames. Edited by whoever owns the spec, after the designer's ruling.                                                                                                                                                                                                                                                                                  |

## 7. What the designer must decide (three open questions)

1/3. **S 3/10 (c) in Firefox: is "the new rest is followed two frames after the stylesheet changes" a pass of the live end
keyframe?** Facts (§9.1) [Test]: Firefox reads the old rest in the task of the class change, paused or running, and one
frame after; two frames after, it reads exactly the mix with the new rest (1.4, end 1.5, nothing changes at the cancel).
Chromium and WebKit follow at once. Consequence [Hyp]: a class, breakpoint or `:hover` rule that changes the rest during
a return is shown up to two frames later in Firefox (about 33 ms at 60 Hz). The rest change itself already moves the value
at once in every engine, so Firefox shows the same step, up to two frames later. Only a rest change in the last two frames
of a return gives a step at the cancel, of the size a Chromium page would show at the change itself. **Recommended**: yes,
a pass; `LIVE_END = true` in the three engines; no fallback, no model amendment; one sentence in the docs' costs (Task
31/35); S 3/10 (c) moves to `engine-facts.browser.spec.ts` with the two-frame read as its criterion and the same-task read
recorded as a Firefox fact. The alternative, the (a, b) fallback (aim at the rest read when the return starts), would
ignore the change for the whole return in every engine: worse.

2/3. **How far does "every hold" reach under `HOLD_MODE = 'filling'`?** The spec says "every hold"; §3.4 and the model
§3.5 name three values the registry leaves after an animation: a state's hold (levels 4 to 7), the presence exit's hold
(level 9, `atEnd: 'hold'`), and a kept frame (level 2, `atEnd: 'keep'`, "left inline" in the model and its glossary).
**Recommended**: all three are filling animations, persisted, because an inline kept frame or exit hold replays the
author's transition from rest exactly as a state hold does [Test for the mechanism (§9.2), Hyp for those two writers].
Legacy ends stay inline (`restingFields` writes them, spec §5.2, until step 5/8), and the registry records them as kept
frames as it does now. Cost: a kept frame keeps one animation alive until it is replaced or detached. Changes: the model's
glossary and §3.5 wording "left inline", spec §3.4 point 2 and §12, cases C3 (`play({ x: 100 })` reads `100px 0px` with
nothing inline) and P2.

3/3. **One registry animation per property.** Spec §3.4 says "a property has one inline value and, at most, one registry
transition". Under `'filling'` there is no inline value. **Recommended rule**: a property has at most one registry
animation, a transition or a hold, apart from what runs under it (a driver, a legacy animation). A claim that starts above
a held lower state reads the current value, records the lower one as covered with its frame and cancels its hold animation,
as it already does for a running transition (I1); the hand-back plays a transition to that frame, then a new hold. This
also keeps the composite order equal to the level order, which creation order would otherwise decide (§3.4).

## 8. Before Task 8/35 (controller)

- Done (commit `25bff1eb`, §9): the two harness changes of §3, the S 3/10 (c) variants of §4, and the "S 10/10 filling"
  variants.
- To do: paste the variables of §1 and the designer's answers to §7 into the briefs (§6); move the fact cases to
  `src/engine-facts.browser.spec.ts` and delete `src/spike/` (Task 2/35 Step 5) once question 1/3 is answered; do S 8/10
  by hand before step 4/8; keep the Chromium log of the re-run beside the other two (§9).

## 9. Re-check (commit `25bff1eb`)

`test(motion): the C1 spike re-checks of the gate report`: the control forces a style computation before its write and
counts `transitionrun` beside `getAnimations()` (§3); S 3/10 (c) gains three variants (one frame, two frames, running);
S 10/10 gains six "filling" variants: the transition's own animation (`fill: 'forwards'`, `persist()`) is the hold, 20
reads, then, in one task, it is cancelled and a one-keyframe return (`offset: 0`) starts; a twin element without the
author's transition runs the same animations with the same `startTime`, and every frame is compared with it by
`expectNoJump`.

Runs: Firefox 18 passed, 9 failed, 1 skipped (28); WebKit 21 passed, 6 failed, 1 skipped (28) [Test: `spike2-firefox.log`,
`spike2-webkit.log`]. Chromium: 27 passed, 1 skipped, as the implementer reported; **no Chromium log of the re-run was
found** (the path given points at the scratchpad folder, and `spike-chromium.log` is the first run, 18 + 1): the Chromium
figures of this section are not read from a log.

### 9.1 S 3/10 (c): a stylesheet rest changed at progress 0.5 (1.1 → 1.5, held start 1.3)

| Variant                                   | Firefox: after (expected) | Firefox: end (expected) | After cancel | WebKit                   |
| ----------------------------------------- | ------------------------- | ----------------------- | ------------ | ------------------------ |
| read in the same task, paused             | 1.2 (1.4) **fail**        | 1.1 (1.5)               | 1.5          | 1.4, 1.5: pass           |
| one frame after, paused                   | 1.2 (1.4) **fail**        | 1.1 (1.5)               | 1.5          | 1.4, 1.5: pass           |
| two frames after, paused                  | 1.4 (1.4) **pass**        | 1.5 (1.5)               | 1.5          | 1.4, 1.5: pass           |
| running in real time, same task (p 0.516) | 1.1968 (1.4032) **fail**  | 1.1 (1.5)               | 1.5          | 1.403 (1.403), 1.5: pass |

Firefox re-reads the stylesheet rest for the implicit end keyframe with a lag of two frames; it does not keep it stale
[Test]. The animations under a live end are followed at once (a, b pass) [Test].

### 9.2 S 10/10: inline against filling

| Variant                                                   | Inline, Firefox                                                            | Inline, WebKit                                  | Filling, Firefox                                                                                                                  | Filling, WebKit                                                                   |
| --------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `transition: scale 200ms`                                 | fail, both orders: first read 1, `CSSTransition` in 12 reads               | fail, both orders: first read 1, 7 reads        | pass: 12 run / 20 held / 13 release frames, 0 `CSSTransition`, 0 `transitionrun`, no jump, equals the twin, at rest, nothing left | pass: 7 / 20 / 8 frames, 0, 0, no jump, twin within 0.0002, at rest, nothing left |
| Tailwind 4.3.3 `transition-[translate,scale,rotate]`      | fail (10, 10)                                                              | fail (5, 5)                                     | pass, the same (0 difference)                                                                                                     | pass, the same (0 difference)                                                     |
| `transition: all 200ms`                                   | fail (12, 12)                                                              | fail (7, 7)                                     | pass, the same                                                                                                                    | pass (twin within 0.0002)                                                         |
| (c) `translate`, rest `-50% 0px`, `transition: translate` | fail (12, 13): first read y 0                                              | fail (7, 7): first read y 0                     | pass (0 difference)                                                                                                               | pass (0 difference)                                                               |
| (c) Tailwind                                              | fail (9, 10)                                                               | fail (5, 5)                                     | pass (13 or 14 release frames)                                                                                                    | pass (twin within 0.02 px)                                                        |
| (c) `transition: all`                                     | fail (12, 12)                                                              | fail (7, 7)                                     | pass                                                                                                                              | pass                                                                              |
| Control: plain inline change                              | **pass now**: 1.003 → 1.04, `CSSTransition` in 11 reads, 1 `transitionrun` | pass: 1.0087 → 1.04, 6 reads, 1 `transitionrun` |                                                                                                                                   |                                                                                   |

- The Firefox control passes once the box has a computed style before the write: the cause given in §3 is confirmed, and
  the inline failures in Firefox are conclusive [Test].
- In every filling variant, in the three phases (run, held, release), neither `getAnimations()` nor `transitionrun` saw an
  author transition [Test]. `HOLD_MODE = 'filling'` and `RETURN_TO_REST = 'live-end'` are measured, not inferred.
- Not covered by the spike [Hyp]: a hold kept beside a later animation on the same property (a layout flight, a legacy
  emphasis), where `persist()` must keep it; Task 8/35 (covering), Task 20/35 (X2) and Task 27/35 test it on the registry.
