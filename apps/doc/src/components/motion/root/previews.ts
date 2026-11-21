/**
 * The previews of the gallery cards (`NeedCard.astro`). Each one plays when its card enters the view, so a touch screen
 * sees them too: once per entry, in the visual order of the cards that entered together, at most three at a time and a
 * beat apart, so the gallery comes to life card by card instead of all at once. A card plays again when it is hovered with
 * a fine pointer or focused from the keyboard, and after it has left the view and come back. Every preview returns to its
 * rest state. Nothing plays under reduced motion (the policy of the runtime, so the site's Reduce motion control holds
 * them too). The loop turns a few times on entry, and while its card is hovered; the tilt follows the pointer.
 *
 * Everything moves with `@udixio/motion`: `animateStyle` over the motion tokens, `createSpring` for the counter, and the
 * view and the visual order are the runtime's (`watchView`, `visualRanks`). This module is imported by the gallery when it
 * nears the view (`Gallery.astro`), so the page shell does not load it.
 */
import { getMotionRuntime, visualRanks, watchView } from '@udixio/motion';
import { animateStyle, createSpring, type StyleKeyframe, type Timing } from '@udixio/motion/animate';

type Play = (preview: HTMLElement, signal: { left: boolean }) => Promise<unknown>;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** The marks of a preview named `name` (`data-p`). */
const marks = (preview: HTMLElement, name: string) => [...preview.querySelectorAll<HTMLElement>(`[data-p="${name}"]`)];
const mark = (preview: HTMLElement, name: string) => marks(preview, name)[0];

/** Plays keyframes on an element and resolves when they end. */
function to(element: Element | undefined, keyframes: StyleKeyframe | StyleKeyframe[], timing: Timing, delay = 0) {
  if (!element) return Promise.resolve();
  return animateStyle(element as HTMLElement, keyframes, { timing, delay, reduced: 'start' }).finished;
}

const FAST = 'spring.fast.spatial';
const DEFAULT = 'spring.default.spatial';
const SLOW = 'spring.slow.spatial';
const EFFECTS = 'spring.fast.effects';
const LINEAR = { duration: 'duration.extraLong2', easing: 'easing.linear' } as const;

const PLAYS: Record<string, Play> = {
  async presence(preview) {
    const toast = mark(preview, 'toast');
    await to(toast, [{ opacity: 1, translate: '0 0', scale: 1 }, { opacity: 0, translate: '0 10px', scale: 0.94 }], EFFECTS);
    await wait(260);
    await to(toast, [{ opacity: 0, translate: '0 10px', scale: 0.94 }, { opacity: 1, translate: '0 0', scale: 1 }], DEFAULT);
  },

  async lists(preview) {
    const rows = marks(preview, 'row');
    await Promise.all(rows.map((row) => to(row, [{ opacity: 1 }, { opacity: 0 }], EFFECTS)));
    await wait(120);
    await Promise.all(
      rows.map((row, index) => to(row, [{ opacity: 0, translate: '0 14px' }, { opacity: 1, translate: '0 0' }], DEFAULT, index * 70)),
    );
  },

  async emphasis(preview) {
    const field = mark(preview, 'field');
    const error = getComputedStyle(field).getPropertyValue('--color-error').trim() || 'currentColor';
    await Promise.all([
      to(
        field,
        [
          { translate: '0 0' },
          { translate: '-10px 0' },
          { translate: '9px 0' },
          { translate: '-6px 0' },
          { translate: '3px 0' },
          { translate: '0 0' },
        ],
        { duration: 'duration.long2', easing: 'easing.standard' },
      ),
      to(field, [{ borderColor: error }, { borderColor: error, offset: 0.6 }, { borderColor: getComputedStyle(field).borderColor }], {
        duration: 'duration.extraLong1',
        easing: 'easing.standard',
      }),
    ]);
  },

  async layout(preview) {
    const card = mark(preview, 'card');
    const chip = mark(preview, 'chip');
    const track = chip.parentElement!.clientWidth - chip.offsetWidth;
    const wide = card.parentElement!.clientWidth;
    await Promise.all([to(card, [{ width: '56px' }, { width: `${wide}px` }], DEFAULT), to(chip, [{ translate: '0 0' }, { translate: `${track}px 0` }], DEFAULT, 60)]);
    await wait(420);
    await Promise.all([to(card, [{ width: `${wide}px` }, { width: '56px' }], DEFAULT), to(chip, [{ translate: `${track}px 0` }, { translate: '0 0' }], DEFAULT, 60)]);
  },

  async 'shared-elements'(preview) {
    const panel = mark(preview, 'panel');
    const shape = mark(preview, 'shape');
    const width = panel.clientWidth;
    const height = panel.clientHeight;
    const closed = 'inset(calc(100% - 36px) calc(100% - 36px) 0px 0px round 10px)';
    const opened = 'inset(0px 0px 0px 0px round 16px)';
    const centre = `${width / 2 - 18}px ${-(height / 2 - 18)}px`;
    await Promise.all([
      to(panel, [{ clipPath: closed }, { clipPath: opened }], DEFAULT),
      to(shape, [{ translate: '0 0', scale: 1 }, { translate: centre, scale: 1.8 }], DEFAULT),
    ]);
    await wait(520);
    await Promise.all([
      to(panel, [{ clipPath: opened }, { clipPath: closed }], DEFAULT),
      to(shape, [{ translate: centre, scale: 1.8 }, { translate: '0 0', scale: 1 }], DEFAULT),
    ]);
  },

  async gestures(preview) {
    const [first, second] = marks(preview, 'row');
    const pitch = second.offsetTop - first.offsetTop;
    await to(first, [{ scale: 1, boxShadow: '0 0 0 0 transparent' }, { scale: 1.05, boxShadow: '0 6px 14px -4px rgb(0 0 0 / 0.35)' }], EFFECTS);
    await Promise.all([
      to(first, [{ translate: '0 0' }, { translate: `0 ${pitch}px` }], DEFAULT),
      to(second, [{ translate: '0 0' }, { translate: `0 ${-pitch}px` }], DEFAULT, 40),
    ]);
    await to(first, [{ scale: 1.05, boxShadow: '0 6px 14px -4px rgb(0 0 0 / 0.35)' }, { scale: 1, boxShadow: '0 0 0 0 transparent' }], EFFECTS);
    await wait(380);
    await Promise.all([
      to(first, [{ translate: `0 ${pitch}px` }, { translate: '0 0' }], DEFAULT),
      to(second, [{ translate: `0 ${-pitch}px` }, { translate: '0 0' }], DEFAULT),
    ]);
  },

  async 'page-transitions'(preview) {
    const a = mark(preview, 'page-a');
    const b = mark(preview, 'page-b');
    await Promise.all([
      to(a, [{ translate: '0 0', opacity: 1 }, { translate: '-30% 0', opacity: 0 }], SLOW),
      to(b, [{ translate: '100% 0' }, { translate: '0 0' }], SLOW),
    ]);
    await wait(480);
    await Promise.all([
      to(a, [{ translate: '-30% 0', opacity: 0 }, { translate: '0 0', opacity: 1 }], SLOW),
      to(b, [{ translate: '0 0' }, { translate: '100% 0' }], SLOW),
    ]);
  },

  async reveal(preview) {
    const cards = marks(preview, 'feed');
    const thumb = mark(preview, 'thumb');
    const travel = thumb.parentElement!.clientHeight - thumb.offsetHeight;
    await Promise.all([
      to(thumb, [{ translate: '0 0' }, { translate: `0 ${travel}px` }], SLOW),
      ...cards.map((card, index) => to(card, [{ opacity: 0, translate: '0 18px' }, { opacity: 1, translate: '0 0' }], DEFAULT, 80 + index * 90)),
    ]);
    await wait(300);
    await to(thumb, [{ translate: `0 ${travel}px` }, { translate: '0 0' }], DEFAULT);
  },

  async scrub(preview) {
    const fill = mark(preview, 'fill');
    const spin = mark(preview, 'spin');
    const thumb = mark(preview, 'thumb');
    const travel = thumb.parentElement!.clientHeight - thumb.offsetHeight;
    // One linear progress drives the three: the scroll is the clock.
    const there = [
      to(fill, [{ scale: '0.1 1' }, { scale: '1 1' }], LINEAR),
      to(spin, [{ rotate: '0deg' }, { rotate: '180deg' }], LINEAR),
      to(thumb, [{ translate: '0 0' }, { translate: `0 ${travel}px` }], LINEAR),
    ];
    await Promise.all(there);
    await wait(240);
    await Promise.all([
      to(fill, [{ scale: '1 1' }, { scale: '0.1 1' }], LINEAR),
      to(spin, [{ rotate: '180deg' }, { rotate: '0deg' }], LINEAR),
      to(thumb, [{ translate: `0 ${travel}px` }, { translate: '0 0' }], LINEAR),
    ]);
  },

  async scroll(preview) {
    const list = mark(preview, 'list');
    const target = mark(preview, 'target');
    const viewport = list.parentElement!;
    const offset = target.offsetTop - list.offsetTop - (viewport.clientHeight - target.offsetHeight) / 2;
    await to(list, [{ translate: '0 0' }, { translate: `0 ${-offset}px` }], SLOW);
    await to(target, [{ scale: 1 }, { scale: 1.06 }, { scale: 1 }], { duration: 'duration.medium4', easing: 'easing.standard' });
    await wait(420);
    await to(list, [{ translate: `0 ${-offset}px` }, { translate: '0 0' }], DEFAULT);
  },

  async values(preview, signal) {
    // A keyboard focus has no pointer: the card tilts along a short path instead.
    if (signal.left) return;
    const tilt = mark(preview, 'tilt');
    await to(tilt, [{ transform: 'rotateX(0deg) rotateY(0deg)' }, { transform: 'rotateX(10deg) rotateY(-14deg)' }], FAST);
    await to(tilt, { transform: 'rotateX(-8deg) rotateY(12deg)' }, DEFAULT);
    await to(tilt, { transform: 'rotateX(0deg) rotateY(0deg)' }, DEFAULT);
  },

  async counters(preview) {
    const number = mark(preview, 'number');
    const format = new Intl.NumberFormat('en');
    await new Promise<void>((resolve) => {
      // An effects spring does not overshoot: the count never passes the number it lands on.
      const spring = createSpring(0, {
        timing: 'spring.slow.effects',
        onUpdate: (value) => (number.textContent = format.format(Math.round(value))),
        onRest: () => resolve(),
      });
      spring.to(1284);
    });
    await wait(700);
    number.textContent = '0';
  },

  async sequences(preview) {
    const steps = marks(preview, 'step');
    const playhead = mark(preview, 'playhead');
    const ruler = playhead.parentElement!.clientWidth - playhead.offsetWidth;
    await Promise.all([
      to(playhead, [{ translate: '0 0' }, { translate: `${ruler}px 0` }], LINEAR),
      ...steps.map((step, index) => to(step, [{ opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1 }], FAST, index * 260)),
    ]);
    await wait(260);
    await to(playhead, [{ translate: `${ruler}px 0` }, { translate: '0 0' }], DEFAULT);
  },

  async text(preview) {
    const letters = marks(preview, 'letter');
    await Promise.all(
      letters.map((letter, index) =>
        to(letter, [{ opacity: 0, translate: '0 0.5em', rotate: '8deg' }, { opacity: 1, translate: '0 0', rotate: '0deg' }], DEFAULT, index * 45),
      ),
    );
  },

  async svg(preview) {
    const ring = mark(preview, 'ring');
    const tick = mark(preview, 'tick');
    tick.style.strokeDashoffset = '1';
    await to(ring, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 'duration.long4', easing: 'easing.standard' });
    await to(tick, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 'duration.long1', easing: 'easing.standardDecelerate' });
    tick.style.removeProperty('stroke-dashoffset');
  },

  async tokens(preview) {
    const balls = marks(preview, 'ball');
    const lane = balls[0].parentElement!.clientWidth - balls[0].offsetWidth;
    const springs = { fast: FAST, default: DEFAULT, slow: SLOW } as const;
    const timing = (ball: HTMLElement) => springs[(ball.dataset.speed ?? 'default') as keyof typeof springs];
    await Promise.all(balls.map((ball) => to(ball, [{ translate: '0 0' }, { translate: `${lane}px 0` }], timing(ball))));
    await wait(300);
    await Promise.all(balls.map((ball) => to(ball, [{ translate: `${lane}px 0` }, { translate: '0 0' }], timing(ball))));
  },

  async scopes(preview) {
    const phone = mark(preview, 'phone-card');
    const desk = mark(preview, 'desk-card');
    // The phone slides its card up; the desktop scales it in: one element, one motion per breakpoint.
    await Promise.all([
      to(phone, [{ opacity: 0, translate: '0 24px' }, { opacity: 1, translate: '0 0' }], DEFAULT),
      to(desk, [{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }], DEFAULT),
    ]);
  },

  async animate(preview) {
    const swatch = mark(preview, 'swatch');
    const style = getComputedStyle(swatch);
    const from = style.backgroundColor;
    const tertiary = style.getPropertyValue('--color-tertiary').trim();
    await to(swatch, [{ backgroundColor: from, borderRadius: '14px', width: '56px' }, { backgroundColor: tertiary, borderRadius: '28px', width: '96px' }], DEFAULT);
    await wait(420);
    await to(swatch, [{ backgroundColor: tertiary, borderRadius: '28px', width: '96px' }, { backgroundColor: from, borderRadius: '14px', width: '56px' }], DEFAULT);
  },

  async accessibility(preview) {
    const full = mark(preview, 'full');
    const reduced = mark(preview, 'reduced');
    const lane = full.parentElement!.clientWidth - full.offsetWidth;
    await Promise.all([
      to(full, [{ translate: '0 0' }, { translate: `${lane}px 0` }], DEFAULT),
      to(reduced, [{ opacity: 0 }, { opacity: 1 }], { duration: 'duration.medium2', easing: 'easing.standard' }),
    ]);
    await wait(420);
    await Promise.all([
      to(full, [{ translate: `${lane}px 0` }, { translate: '0 0' }], DEFAULT),
      to(reduced, [{ opacity: 1 }, { opacity: 0 }], { duration: 'duration.medium2', easing: 'easing.standard' }),
    ]);
  },
};

/** The loop turns on entry, and while its card is hovered or focused; then it comes to rest on the nearest whole turn. */
function loop(card: HTMLElement, preview: HTMLElement) {
  const spinner = mark(preview, 'spinner');
  let turning: ReturnType<typeof animateStyle> | undefined;
  return {
    get turning() {
      return turning !== undefined;
    },
    start() {
      if (turning || reduced()) return;
      turning = animateStyle(spinner, [{ rotate: '0deg' }, { rotate: '360deg' }], {
        timing: { duration: 'duration.extraLong4', easing: 'easing.linear' },
        iterations: Infinity,
      });
    },
    stop() {
      if (!turning) return;
      const angle = Number.parseFloat(getComputedStyle(spinner).rotate) || 0;
      turning.cancel();
      turning = undefined;
      animateStyle(spinner, [{ rotate: `${angle}deg` }, { rotate: `${angle > 180 ? 360 : 0}deg` }], { timing: DEFAULT }).finished.then(() => {
        if (!turning) spinner.style.removeProperty('rotate');
      });
    },
    card,
  };
}

/** The tilt follows the pointer over its card, over a fast spring, and comes back flat when the pointer leaves. */
function tilt(card: HTMLElement, preview: HTMLElement) {
  const element = mark(preview, 'tilt');
  return {
    move(event: PointerEvent) {
      if (reduced()) return;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      animateStyle(element, { transform: `rotateX(${(-y * 22).toFixed(2)}deg) rotateY(${(x * 28).toFixed(2)}deg)` }, { timing: FAST });
    },
    leave() {
      animateStyle(element, { transform: 'rotateX(0deg) rotateY(0deg)' }, { timing: DEFAULT });
    },
  };
}

function reduced(): boolean {
  return getMotionRuntime().policy.reduced;
}

/** The inline style of every mark at rest, put back once a preview has played, so nothing it wrote stays (theme colours). */
function restore(preview: HTMLElement, rest: Map<HTMLElement, string | null>): void {
  for (const [element, style] of rest) {
    if (style === null) element.removeAttribute('style');
    else element.setAttribute('style', style);
  }
}

/** How the previews start on entering the view: after the card has risen, a beat apart, never more than three at once. */
const ENTRY_DELAY = 420;
const ENTRY_STEP = 240;
const ENTRY_AT_ONCE = 3;
/** How long the loop turns on entry before it comes to rest. */
const LOOP_ON_ENTRY = 2600;

/** Wires the cards under `root`; returns the teardown. */
export function mountPreviews(root: HTMLElement): () => void {
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const cleanups: (() => void)[] = [];
  /** What each card plays when its turn comes on entering the view; resolves once it is back at rest. */
  const onEntry = new Map<HTMLElement, () => Promise<void> | undefined>();

  for (const card of root.querySelectorAll<HTMLElement>('[data-need-card]')) {
    const preview = card.querySelector<HTMLElement>('[data-preview]');
    const slug = card.dataset.needCard ?? '';
    if (!preview) continue;
    const rest = new Map<HTMLElement, string | null>(
      [...preview.querySelectorAll<HTMLElement>('[data-p]')].map((element) => [element, element.getAttribute('style')]),
    );
    let playing = false;
    const signal = { left: false };

    /** Plays the preview once; undefined when it does not play (already playing, no preview, reduced motion). */
    const play = (fromPointer: boolean): Promise<void> | undefined => {
      const run = PLAYS[slug];
      if (!run || playing || reduced()) return undefined;
      playing = true;
      signal.left = slug === 'values' && fromPointer;
      return run(preview, signal)
        .catch(() => undefined)
        .then(() => {
          restore(preview, rest);
          playing = false;
        });
    };

    const spinner = slug === 'loop' ? loop(card, preview) : undefined;
    const follow = slug === 'values' ? tilt(card, preview) : undefined;

    onEntry.set(card, () => {
      if (!spinner) return play(false);
      if (reduced() || spinner.turning) return undefined;
      spinner.start();
      return new Promise<void>((resolve) => window.setTimeout(resolve, LOOP_ON_ENTRY)).then(() => {
        if (!card.matches(':hover, :focus-visible')) spinner.stop();
      });
    });

    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !hover.matches) return;
      if (spinner) return spinner.start();
      if (follow) return;
      play(true);
    };
    const onMove = (event: PointerEvent) => {
      if (follow && event.pointerType !== 'touch' && hover.matches) follow.move(event);
    };
    const onLeave = () => {
      spinner?.stop();
      follow?.leave();
    };
    const onFocus = () => {
      if (!card.matches(':focus-visible')) return;
      if (spinner) return spinner.start();
      play(false);
    };
    const onBlur = () => spinner?.stop();

    card.addEventListener('pointerenter', onEnter);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    card.addEventListener('focus', onFocus);
    card.addEventListener('blur', onBlur);
    cleanups.push(() => {
      card.removeEventListener('pointerenter', onEnter);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
      card.removeEventListener('focus', onFocus);
      card.removeEventListener('blur', onBlur);
      spinner?.stop();
      restore(preview, rest);
    });
  }

  cleanups.push(playOnEntry(onEntry));
  return () => cleanups.forEach((cleanup) => cleanup());
}

/**
 * Plays each card once each time it enters the view. The cards that enter together wait in a queue, in visual order (the
 * runtime's `visualRanks`, as a cascade orders its items); the queue starts one every ENTRY_STEP, at most ENTRY_AT_ONCE at a
 * time, and drops a card that leaves the view before its turn.
 */
function playOnEntry(onEntry: Map<HTMLElement, () => Promise<void> | undefined>): () => void {
  const queue: HTMLElement[] = [];
  const entered: HTMLElement[] = [];
  /** A card plays once per entry: it is armed again when it leaves the view. */
  const armed = new Set(onEntry.keys());
  let running = 0;
  let next = 0;
  let timer: number | undefined;
  let stopped = false;

  const pump = () => {
    window.clearTimeout(timer);
    timer = undefined;
    if (stopped) return;
    while (queue.length > 0 && running < ENTRY_AT_ONCE) {
      const wait = next - performance.now();
      if (wait > 0) {
        timer = window.setTimeout(pump, wait);
        return;
      }
      const card = queue.shift()!;
      const played = onEntry.get(card)?.();
      if (!played) continue;
      running++;
      next = performance.now() + ENTRY_STEP;
      void played.finally(() => {
        running--;
        pump();
      });
    }
  };

  /** The cards that entered in one task join the queue together, in visual order, after their rise. */
  const admit = () => {
    if (entered.length === 0) return;
    const batch = entered.splice(0);
    const ranks = visualRanks(batch.map((card) => card.getBoundingClientRect()), 'first');
    batch.sort((a, b) => ranks[batch.indexOf(a)] - ranks[batch.indexOf(b)]);
    queue.push(...batch);
    next = Math.max(next, performance.now() + ENTRY_DELAY);
    pump();
  };

  const stops = [...onEntry.keys()].map((card) =>
    watchView(card, 'block', (inView) => {
      if (inView) {
        if (!armed.delete(card)) return;
        if (entered.length === 0) queueMicrotask(admit);
        entered.push(card);
      } else {
        armed.add(card);
        const waiting = queue.indexOf(card);
        if (waiting >= 0) queue.splice(waiting, 1);
      }
    }),
  );

  return () => {
    stopped = true;
    window.clearTimeout(timer);
    stops.forEach((stop) => stop());
  };
}
