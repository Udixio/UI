import { afterEach, beforeAll, describe, expect, it } from 'vitest';

// The channel spike of spec section 4.3 (gate 1/3). It uses the DOM and the Web Animations API only and imports nothing of the
// package. Each case logs one JSON line, `{ case, engine, label, values }`, with console.info: the controller builds the table
// of the report from those lines. A failed criterion is data for the controller, not a reason to change the criterion.

const TRANSLATE_TOLERANCE = 0.5; // px
const SCALE_TOLERANCE = 0.005;

/**
 * The stylesheet of the cases that need a rest or an author's transition. The `transition-[translate,scale,rotate]` declarations
 * are copied from the compiled output of Tailwind 4.3.3 (node_modules/tailwindcss), with the theme defaults it reads:
 * `--default-transition-duration: 150ms` and `--default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)`.
 */
const SPIKE_CSS = `
.spike-rest-a { scale: 1.1; }
.spike-rest-b { scale: 1.5; }
.spike-s10-scale { transition: scale 200ms; }
.spike-s10-tailwind {
  transition-property: translate,scale,rotate;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.spike-s10-all { transition: all 200ms; }
.spike-s10-translate { transition: translate 200ms; }
.spike-s10-rest-c { translate: -50% 0px; }
`;

/** The four axis properties of spec section 4.2. */
const AXES = [
  {
    name: '--udx-motion-axis-x',
    syntax: '<length-percentage>',
    initialValue: '0px',
  },
  {
    name: '--udx-motion-axis-y',
    syntax: '<length-percentage>',
    initialValue: '0px',
  },
  { name: '--udx-motion-axis-scale-x', syntax: '<number>', initialValue: '1' },
  { name: '--udx-motion-axis-scale-y', syntax: '<number>', initialValue: '1' },
];

const mounted: Element[] = [];

beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = SPIKE_CSS;
  document.head.append(style);
});

afterEach(() => {
  for (const element of mounted.splice(0)) element.remove();
});

/** The engine that runs the page, read from its user agent. */
function engine(): string {
  const agent = navigator.userAgent;
  if (agent.includes('Firefox/')) return 'firefox';
  if (agent.includes('Chrome/')) return 'chromium';
  if (agent.includes('Safari/')) return 'webkit';
  return 'unknown';
}

/** Logs the values of one case as a JSON line. */
function record(caseName: string, label: string, values: unknown): void {
  console.info(
    JSON.stringify({ case: caseName, engine: engine(), label, values }),
  );
}

/** The next animation frame. */
function nextFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

/** The computed value of a property, as the engine serialises it. */
function read(element: Element, property: string): string {
  return getComputedStyle(element).getPropertyValue(property).trim();
}

/** The two numbers of a computed `translate`: a missing second value is 0, and `none` is `0 0`. */
function translateOf(value: string): [number, number] {
  if (value === 'none') return [0, 0];
  const [x = NaN, y = 0] = value.split(/\s+/).map((token) => parseFloat(token));
  return [x, y];
}

/** The two numbers of a computed `scale`: a missing second value repeats the first, and `none` is `1 1`. */
function scaleOf(value: string): [number, number] {
  if (value === 'none') return [1, 1];
  const [x = NaN, y = x] = value.split(/\s+/).map((token) => parseFloat(token));
  return [x, y];
}

/** Asserts that each component of `actual` is within `tolerance` of the same component of `expected`. */
function expectClose(
  actual: readonly number[],
  expected: readonly number[],
  tolerance: number,
): void {
  expected.forEach((value, index) => {
    expect(
      Math.abs(actual[index] - value),
      `component ${index}: ${actual[index]} for ${value}`,
    ).toBeLessThanOrEqual(tolerance);
  });
}

/** Whether each component of `actual` is within `tolerance` of the same component of `expected`. */
function isClose(
  actual: readonly number[],
  expected: readonly number[],
  tolerance: number,
): boolean {
  return expected.every(
    (value, index) => Math.abs(actual[index] - value) <= tolerance,
  );
}

/** The value a property has without this animation's effect, read in the same task. */
function withoutEffect(
  animation: Animation,
  element: Element,
  property: string,
): string {
  const effect = animation.effect;
  animation.effect = null;
  const value = read(element, property);
  animation.effect = effect;
  return value;
}

/** A box inserted in the page, removed after its test. */
function box(className = ''): HTMLElement {
  const element = document.createElement('div');
  element.className = className;
  element.style.width = '40px';
  element.style.height = '40px';
  document.body.append(element);
  mounted.push(element);
  return element;
}

/** Registers a custom property; a second registration of the same name in this page is ignored. */
function registerProperty(
  name: string,
  syntax: string,
  initialValue: string,
): void {
  try {
    CSS.registerProperty({ name, syntax, inherits: false, initialValue });
  } catch (error) {
    if (!(
      error instanceof DOMException && error.name === 'InvalidModificationError'
    ))
      throw error;
  }
}

function registerAxes(): void {
  for (const axis of AXES)
    registerProperty(axis.name, axis.syntax, axis.initialValue);
}

/** Seeks each animation to `progress` of its own duration. */
function seekAll(
  entries: ReadonlyArray<readonly [Animation, number]>,
  progress: number,
): void {
  for (const [animation, duration] of entries)
    animation.currentTime = progress * duration;
}

const round = (value: number): number => Math.round(value * 10000) / 10000;

interface MixRow {
  progress: number;
  underlying: number;
  value: number;
  expected: number;
}

/**
 * The hold at its current time: its value, and the underlying value read in the same task. The spec's mix is the held start at
 * progress 0 and the underlying value at progress 1, linear between them.
 */
function mixAt(
  element: HTMLElement,
  hold: Animation,
  property: string,
  component: (value: string) => number,
  held: number,
  duration: number,
): MixRow {
  const progress = Number(hold.currentTime) / duration;
  const underlying = component(withoutEffect(hold, element, property));
  const value = component(read(element, property));
  return {
    progress,
    underlying,
    value,
    expected: held + progress * (underlying - held),
  };
}

const roundRow = (row: MixRow) => ({
  progress: round(row.progress),
  underlying: round(row.underlying),
  value: round(row.value),
  expected: round(row.expected),
});

/** Times of the holds of S 3/10: the lower animation's time and the hold's time, in ms. */
const MIX_STEPS = [
  { lower: 500, hold: 250 },
  { lower: 500, hold: 0 },
  { lower: 500, hold: 1000 },
  { lower: 800, hold: 500 },
  { lower: 800, hold: 1000 },
];

describe('S 1/10 two replace animations on translate', () => {
  it('the later animation gives the value of both axes', async () => {
    const element = box();
    const first = element.animate(
      [{ translate: '0px 0px' }, { translate: '40px 0px' }],
      {
        duration: 1000,
        fill: 'forwards',
        composite: 'replace',
      },
    );
    const second = element.animate(
      [{ translate: '0px 0px' }, { translate: '0px 20px' }],
      {
        duration: 1000,
        fill: 'forwards',
        composite: 'replace',
      },
    );
    first.finish();
    second.finish();
    await nextFrame();
    const value = read(element, 'translate');
    record('S 1/10', 'replace: the later animation gives both axes', {
      translate: value,
    });
    expectClose(translateOf(value), [0, 20], TRANSLATE_TOLERANCE);
  });
});

describe('S 2/10 one custom property per axis', () => {
  it('each axis holds the value of its own animation at each instant', () => {
    registerAxes();
    const rows: unknown[] = [];
    const steps = [0.25, 0.5, 0.75];

    // Pixels: x from 0 to 100px over 800 ms, linear; y from 0 to 50px over 400 ms, ease-in.
    const split = box();
    split.style.setProperty(
      'translate',
      'var(--udx-motion-axis-x) var(--udx-motion-axis-y)',
    );
    const splitX = split.animate(
      [{ '--udx-motion-axis-x': '0px' }, { '--udx-motion-axis-x': '100px' }],
      {
        duration: 800,
        easing: 'linear',
        fill: 'both',
      },
    );
    const splitY = split.animate(
      [{ '--udx-motion-axis-y': '0px' }, { '--udx-motion-axis-y': '50px' }],
      {
        duration: 400,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'both',
      },
    );
    const refXBox = box();
    const refX = refXBox.animate(
      [{ translate: '0px 0px' }, { translate: '100px 0px' }],
      {
        duration: 800,
        easing: 'linear',
        fill: 'both',
      },
    );
    const refYBox = box();
    const refY = refYBox.animate(
      [{ translate: '0px 0px' }, { translate: '0px 50px' }],
      {
        duration: 400,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'both',
      },
    );
    for (const animation of [splitX, splitY, refX, refY]) animation.pause();
    for (const progress of steps) {
      seekAll(
        [
          [splitX, 800],
          [splitY, 400],
        ],
        progress,
      );
      seekAll(
        [
          [refX, 800],
          [refY, 400],
        ],
        progress,
      );
      const actual = translateOf(read(split, 'translate'));
      const expected = [
        translateOf(read(refXBox, 'translate'))[0],
        translateOf(read(refYBox, 'translate'))[1],
      ];
      expectClose(actual, expected, TRANSLATE_TOLERANCE);
      rows.push({ block: 'px', progress, actual, expected });
    }

    // A percentage on x: from -50% to -100% over 800 ms, linear; y as above.
    const splitPercent = box();
    splitPercent.style.setProperty(
      'translate',
      'var(--udx-motion-axis-x) var(--udx-motion-axis-y)',
    );
    const percentX = splitPercent.animate(
      [{ '--udx-motion-axis-x': '-50%' }, { '--udx-motion-axis-x': '-100%' }],
      {
        duration: 800,
        easing: 'linear',
        fill: 'both',
      },
    );
    const percentY = splitPercent.animate(
      [{ '--udx-motion-axis-y': '0px' }, { '--udx-motion-axis-y': '50px' }],
      {
        duration: 400,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'both',
      },
    );
    const refPercentBox = box();
    const refPercent = refPercentBox.animate(
      [{ translate: '-50% 0px' }, { translate: '-100% 0px' }],
      {
        duration: 800,
        easing: 'linear',
        fill: 'both',
      },
    );
    for (const animation of [percentX, percentY, refPercent]) animation.pause();
    for (const progress of steps) {
      seekAll(
        [
          [percentX, 800],
          [percentY, 400],
        ],
        progress,
      );
      seekAll(
        [
          [refPercent, 800],
          [refY, 400],
        ],
        progress,
      );
      const actual = translateOf(read(splitPercent, 'translate'));
      const expected = [
        translateOf(read(refPercentBox, 'translate'))[0],
        translateOf(read(refYBox, 'translate'))[1],
      ];
      expectClose(actual, expected, TRANSLATE_TOLERANCE);
      rows.push({ block: 'percentage on x', progress, actual, expected });
    }

    // The scale pair: scaleX from 1 to 2 over 800 ms, linear; scaleY from 1 to 0.5 over 400 ms, ease-in.
    const splitScale = box();
    splitScale.style.setProperty(
      'scale',
      'var(--udx-motion-axis-scale-x) var(--udx-motion-axis-scale-y)',
    );
    const scaleX = splitScale.animate(
      [
        { '--udx-motion-axis-scale-x': '1' },
        { '--udx-motion-axis-scale-x': '2' },
      ],
      {
        duration: 800,
        easing: 'linear',
        fill: 'both',
      },
    );
    const scaleY = splitScale.animate(
      [
        { '--udx-motion-axis-scale-y': '1' },
        { '--udx-motion-axis-scale-y': '0.5' },
      ],
      {
        duration: 400,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'both',
      },
    );
    const refScaleXBox = box();
    const refScaleX = refScaleXBox.animate(
      [{ scale: '1 1' }, { scale: '2 1' }],
      { duration: 800, easing: 'linear', fill: 'both' },
    );
    const refScaleYBox = box();
    const refScaleY = refScaleYBox.animate(
      [{ scale: '1 1' }, { scale: '1 0.5' }],
      {
        duration: 400,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'both',
      },
    );
    for (const animation of [scaleX, scaleY, refScaleX, refScaleY])
      animation.pause();
    for (const progress of steps) {
      seekAll(
        [
          [scaleX, 800],
          [scaleY, 400],
        ],
        progress,
      );
      seekAll(
        [
          [refScaleX, 800],
          [refScaleY, 400],
        ],
        progress,
      );
      const actual = scaleOf(read(splitScale, 'scale'));
      const expected = [
        scaleOf(read(refScaleXBox, 'scale'))[0],
        scaleOf(read(refScaleYBox, 'scale'))[1],
      ];
      expectClose(actual, expected, SCALE_TOLERANCE);
      rows.push({ block: 'scale pair', progress, actual, expected });
    }
    record('S 2/10', 'per axis: px, a percentage on x, the scale pair', rows);
  });
});

describe('S 3/10 the live end keyframe', () => {
  it('(a) above a lower scale that is sought further between two reads', () => {
    const element = box();
    const lower = element.animate([{ scale: '1' }, { scale: '2' }], {
      duration: 1000,
      easing: 'linear',
      fill: 'both',
    });
    const hold = element.animate([{ scale: '1.2', offset: 0 }], {
      duration: 1000,
      easing: 'linear',
      fill: 'both',
    });
    lower.pause();
    hold.pause();
    const component = (value: string) => scaleOf(value)[0];
    const rows = MIX_STEPS.map((step) => {
      lower.currentTime = step.lower;
      hold.currentTime = step.hold;
      return mixAt(element, hold, 'scale', component, 1.2, 1000);
    });
    for (const row of rows)
      expect(Math.abs(row.value - row.expected)).toBeLessThanOrEqual(
        SCALE_TOLERANCE,
      );
    expect(
      new Set(rows.map((row) => round(row.underlying))).size,
      'the underlying value moves',
    ).toBeGreaterThan(1);
    const last = rows[rows.length - 1];
    hold.cancel();
    const afterCancel = component(read(element, 'scale'));
    record('S 3/10', '(a) above a lower scale, sought further', {
      rows: rows.map(roundRow),
      afterCancel: round(afterCancel),
    });
    expect(
      Math.abs(afterCancel - last.value),
      'removing the animation changes nothing',
    ).toBeLessThanOrEqual(SCALE_TOLERANCE);
  });

  it('(b) above the same on a custom property', () => {
    registerAxes();
    const element = box();
    element.style.setProperty('translate', 'var(--udx-motion-axis-x) 0px');
    const lower = element.animate(
      [{ '--udx-motion-axis-x': '0px' }, { '--udx-motion-axis-x': '100px' }],
      {
        duration: 1000,
        easing: 'linear',
        fill: 'both',
      },
    );
    const hold = element.animate(
      [{ '--udx-motion-axis-x': '12px', offset: 0 }],
      { duration: 1000, easing: 'linear', fill: 'both' },
    );
    lower.pause();
    hold.pause();
    const component = (value: string) => translateOf(value)[0];
    const rows = MIX_STEPS.map((step) => {
      lower.currentTime = step.lower;
      hold.currentTime = step.hold;
      return mixAt(element, hold, 'translate', component, 12, 1000);
    });
    for (const row of rows)
      expect(Math.abs(row.value - row.expected)).toBeLessThanOrEqual(
        TRANSLATE_TOLERANCE,
      );
    expect(
      new Set(rows.map((row) => round(row.underlying))).size,
      'the underlying value moves',
    ).toBeGreaterThan(1);
    const last = rows[rows.length - 1];
    hold.cancel();
    const afterCancel = component(read(element, 'translate'));
    record('S 3/10', '(b) above the same on a custom property', {
      rows: rows.map(roundRow),
      afterCancel: round(afterCancel),
    });
    expect(
      Math.abs(afterCancel - last.value),
      'removing the animation changes nothing',
    ).toBeLessThanOrEqual(TRANSLATE_TOLERANCE);
  });

  it('(c) above a stylesheet rest that a class changes half-way', () => {
    const element = box('spike-rest-a');
    const hold = element.animate([{ scale: '1.3', offset: 0 }], {
      duration: 1000,
      easing: 'linear',
      fill: 'both',
    });
    hold.pause();
    const component = (value: string) => scaleOf(value)[0];
    hold.currentTime = 500;
    const before = mixAt(element, hold, 'scale', component, 1.3, 1000);
    element.className = 'spike-rest-b';
    const after = mixAt(element, hold, 'scale', component, 1.3, 1000);
    hold.currentTime = 1000;
    const end = mixAt(element, hold, 'scale', component, 1.3, 1000);
    hold.cancel();
    const afterCancel = component(read(element, 'scale'));
    record(
      'S 3/10',
      '(c) above a stylesheet rest that a class changes at progress 0.5',
      {
        before: roundRow(before),
        after: roundRow(after),
        end: roundRow(end),
        afterCancel: round(afterCancel),
      },
    );
    for (const row of [before, after, end])
      expect(Math.abs(row.value - row.expected)).toBeLessThanOrEqual(
        SCALE_TOLERANCE,
      );
    expect(Math.abs(afterCancel - end.value)).toBeLessThanOrEqual(
      SCALE_TOLERANCE,
    );
  });

  it('(d) above a scroll-driven animation, while the page is scrolled by script', async () => {
    const TimelineConstructor = (
      window as unknown as {
        ViewTimeline?: new (options: {
          subject: Element;
          axis: string;
        }) => unknown;
      }
    ).ViewTimeline;
    if (!TimelineConstructor) {
      record('S 3/10', '(d) no ViewTimeline in this engine', {
        unsupported: true,
      });
      return;
    }
    const scroller = document.createElement('div');
    scroller.style.width = '200px';
    scroller.style.height = '200px';
    scroller.style.overflow = 'auto';
    const content = document.createElement('div');
    content.style.paddingTop = '600px';
    content.style.height = '1600px';
    const element = document.createElement('div');
    element.style.width = '40px';
    element.style.height = '40px';
    content.append(element);
    scroller.append(content);
    document.body.append(scroller);
    mounted.push(scroller);
    const timeline = new TimelineConstructor({
      subject: element,
      axis: 'block',
    });
    const lower = element.animate([{ scale: '1' }, { scale: '2' }], {
      timeline,
      fill: 'both',
      easing: 'linear',
    } as KeyframeAnimationOptions);
    const hold = element.animate([{ scale: '1.2', offset: 0 }], {
      duration: 1000,
      easing: 'linear',
      fill: 'both',
    });
    hold.pause();
    hold.currentTime = 500;
    const component = (value: string) => scaleOf(value)[0];
    const rows: MixRow[] = [];
    for (const top of [400, 480, 560, 640]) {
      scroller.scrollTop = top;
      await nextFrame();
      rows.push(mixAt(element, hold, 'scale', component, 1.2, 1000));
    }
    hold.currentTime = 1000;
    const end = mixAt(element, hold, 'scale', component, 1.2, 1000);
    hold.cancel();
    const afterCancel = component(read(element, 'scale'));
    lower.cancel();
    record(
      'S 3/10',
      '(d) above a scroll-driven scale, the page scrolled by script',
      {
        rows: rows.map(roundRow),
        end: roundRow(end),
        afterCancel: round(afterCancel),
      },
    );
    expect(
      Math.abs(afterCancel - end.value),
      'removing the animation changes nothing',
    ).toBeLessThanOrEqual(SCALE_TOLERANCE);
    for (const row of [...rows, end])
      expect(Math.abs(row.value - row.expected)).toBeLessThanOrEqual(
        SCALE_TOLERANCE,
      );
    expect(
      new Set(rows.map((row) => round(row.underlying))).size,
      'the driver moves with the scroll',
    ).toBeGreaterThan(1);
  });
});

describe('S 4/10 whole to split, in one task at about 40 %', () => {
  it('the twins with the same startTime keep the value and the path of an untouched animation', async () => {
    registerAxes();
    const element = box();
    const untouchedBox = box();
    const keyframes = [{ translate: '0px 0px' }, { translate: '200px 100px' }];
    const timing: KeyframeAnimationOptions = {
      duration: 1000,
      easing: 'linear',
      fill: 'both',
    };
    const startedAt = Number(document.timeline.currentTime);
    const whole = element.animate(keyframes, timing);
    const untouched = untouchedBox.animate(keyframes, timing);
    whole.startTime = startedAt;
    untouched.startTime = startedAt;
    for (let frame = 0; frame < 600 && Number(whole.currentTime) < 400; frame++)
      await nextFrame();
    const progressAtSwitch = Number(whole.currentTime) / 1000;

    // One task: the value before, the cancel, the twins on the custom properties with the same startTime, the inline pair, the value after.
    const before = translateOf(read(element, 'translate'));
    const twinStart = Number(whole.startTime);
    whole.cancel();
    const twinX = element.animate(
      [{ '--udx-motion-axis-x': '0px' }, { '--udx-motion-axis-x': '200px' }],
      timing,
    );
    const twinY = element.animate(
      [{ '--udx-motion-axis-y': '0px' }, { '--udx-motion-axis-y': '100px' }],
      timing,
    );
    twinX.startTime = twinStart;
    twinY.startTime = twinStart;
    element.style.setProperty(
      'translate',
      'var(--udx-motion-axis-x) var(--udx-motion-axis-y)',
    );
    const after = translateOf(read(element, 'translate'));

    const deviations: number[] = [];
    for (let frame = 0; frame < 10; frame++) {
      await nextFrame();
      const mine = translateOf(read(element, 'translate'));
      const theirs = translateOf(read(untouchedBox, 'translate'));
      deviations.push(
        Math.max(Math.abs(mine[0] - theirs[0]), Math.abs(mine[1] - theirs[1])),
      );
    }
    record('S 4/10', 'whole to split at about 40 %', {
      progressAtSwitch: round(progressAtSwitch),
      before,
      after,
      deviations: deviations.map(round),
    });
    expectClose(after, before, TRANSLATE_TOLERANCE);
    expect(
      Math.max(...deviations),
      'within 1 px of the untouched animation over ten frames',
    ).toBeLessThanOrEqual(1);
    twinX.cancel();
    twinY.cancel();
  });
});

describe('S 5/10 a hold above a driver that is created again', () => {
  it('the hold keeps its value before, in and after the task, and stays active', async () => {
    const element = box();
    const holdKeyframes = [
      { translate: '50px 0px' },
      { translate: '50px 0px' },
    ];
    const driverKeyframes = [
      { translate: '0px 0px' },
      { translate: '100px 0px' },
    ];
    const driverTiming: KeyframeAnimationOptions = {
      duration: 1000,
      easing: 'linear',
      fill: 'both',
    };
    const holdTiming: KeyframeAnimationOptions = {
      duration: 0,
      fill: 'forwards',
    };
    let driver = element.animate(driverKeyframes, driverTiming);
    driver.pause();
    driver.currentTime = 300;
    let hold = element.animate(holdKeyframes, holdTiming);
    const samples: Array<{
      phase: string;
      translate: number;
      replaceState: string;
    }> = [];
    const sample = (phase: string) => {
      samples.push({
        phase,
        translate: translateOf(read(element, 'translate'))[0],
        replaceState: hold.replaceState,
      });
    };
    for (let frame = 0; frame < 10; frame++) {
      await nextFrame();
      sample('before');
    }
    // One task: the driver cancelled and created again, the hold cancelled and created again above it.
    driver.cancel();
    driver = element.animate(driverKeyframes, driverTiming);
    driver.pause();
    driver.currentTime = 300;
    hold.cancel();
    hold = element.animate(holdKeyframes, holdTiming);
    sample('in the task');
    for (let frame = 0; frame < 10; frame++) {
      await nextFrame();
      sample('after');
    }
    record(
      'S 5/10',
      'a zero-duration hold above a paused driver, both created again in one task',
      samples,
    );
    for (const entry of samples) {
      expect(
        Math.abs(entry.translate - 50),
        `${entry.phase}: ${entry.translate}`,
      ).toBeLessThanOrEqual(TRANSLATE_TOLERANCE);
      expect(entry.replaceState, entry.phase).toBe('active');
    }
    driver.cancel();
    hold.cancel();
  });
});

describe('S 6/10 registration and an unregistered property', () => {
  it('a second registration throws and changes nothing; an unregistered property does not interpolate', () => {
    const name = '--spike-twice';
    registerProperty(name, '<length>', '0px');
    let thrown = 'none';
    try {
      CSS.registerProperty({
        name,
        syntax: '<length>',
        inherits: false,
        initialValue: '0px',
      });
    } catch (error) {
      thrown = (error as DOMException).name;
    }
    const registered = box();
    const twice = registered.animate([{ [name]: '0px' }, { [name]: '100px' }], {
      duration: 1000,
      easing: 'linear',
      fill: 'both',
    });
    twice.pause();
    twice.currentTime = 500;
    const plain = box();
    const unregistered = '--spike-unregistered';
    const discrete = plain.animate(
      [{ [unregistered]: '0px' }, { [unregistered]: '100px' }],
      {
        duration: 1000,
        easing: 'linear',
        fill: 'both',
      },
    );
    discrete.pause();
    discrete.currentTime = 250;
    const unregisteredAt25 = read(plain, unregistered);
    discrete.currentTime = 750;
    const unregisteredAt75 = read(plain, unregistered);
    const registeredAt50 = read(registered, name);
    record('S 6/10', 'second registration; unregistered property', {
      thrown,
      registeredAt50,
      unregisteredAt25,
      unregisteredAt75,
    });
    expect(thrown).toBe('InvalidModificationError');
    expect(Math.abs(parseFloat(registeredAt50) - 50)).toBeLessThanOrEqual(
      TRANSLATE_TOLERANCE,
    );
    expect(parseFloat(unregisteredAt25)).toBe(0);
    expect(parseFloat(unregisteredAt75)).toBe(100);
  });
});

describe('S 7/10 composite add (no pass or fail)', () => {
  it('writes down the sums of translate, of translate on a percentage, and of scale', async () => {
    const translated = box();
    translated.style.setProperty('translate', '0px 5px');
    translated
      .animate([{ translate: '10px 0px' }, { translate: '10px 0px' }], {
        duration: 1000,
        fill: 'forwards',
        composite: 'add',
      })
      .finish();
    const percent = box();
    percent.style.setProperty('translate', '-50% 0px');
    percent
      .animate([{ translate: '0px 5px' }, { translate: '0px 5px' }], {
        duration: 1000,
        fill: 'forwards',
        composite: 'add',
      })
      .finish();
    const scaled = box();
    scaled.style.setProperty('scale', '2');
    scaled
      .animate([{ scale: '1.5' }, { scale: '1.5' }], {
        duration: 1000,
        fill: 'forwards',
        composite: 'add',
      })
      .finish();
    await nextFrame();
    record('S 7/10', 'add: translate 10px 0px on 0px 5px', {
      translate: read(translated, 'translate'),
    });
    record('S 7/10', 'add: translate 0px 5px on -50% 0px', {
      translate: read(percent, 'translate'),
    });
    record('S 7/10', 'add: scale 1.5 on 2', { scale: read(scaled, 'scale') });
  });
});

describe('S 8/10 composited or not (by hand, Chromium only)', () => {
  it.skip('is read in the DevTools performance trace of the whole and of the split translate', () => {
    // Manual procedure, not automated: in Chromium, open DevTools, Performance, record while a translate animation runs (whole,
    // then split as in S 4/10), and read the "Animations" track of each. Write down whether each is composited and, when it is
    // not, the failure reason shown ("Compositing failed"). This confirms or refutes fact 8 of spec section 4.1.
  });
});

describe('S 9/10 the first frame', () => {
  it('the first frame and every frame of the delay read the first keyframe', async () => {
    registerAxes();
    const element = box();
    element.style.setProperty(
      'translate',
      'var(--udx-motion-axis-x) var(--udx-motion-axis-y)',
    );
    const animation = element.animate(
      [
        { opacity: 0, '--udx-motion-axis-y': '24px' },
        { opacity: 1, '--udx-motion-axis-y': '0px' },
      ],
      { duration: 400, delay: 200, easing: 'linear', fill: 'both' },
    );
    const samples: Array<{ time: number; opacity: string; axisY: string }> = [];
    for (
      let frame = 0;
      frame < 120 && Number(animation.currentTime) < 260;
      frame++
    ) {
      await nextFrame();
      samples.push({
        time: Number(animation.currentTime),
        opacity: read(element, 'opacity'),
        axisY: read(element, '--udx-motion-axis-y'),
      });
    }
    const delay = samples.filter((sample) => sample.time < 200);
    record('S 9/10', 'the first frame and the delay of 200 ms', {
      frames: samples.length,
      delay: delay.length,
      samples,
    });
    expect(samples.length, 'a frame was read').toBeGreaterThan(0);
    expect(samples[0].time, 'the first frame is in the delay').toBeLessThan(
      200,
    );
    for (const sample of delay) {
      expect(sample.opacity, `opacity at ${sample.time} ms`).toBe('0');
      expect(
        Math.abs(parseFloat(sample.axisY) - 24),
        `axis y at ${sample.time} ms`,
      ).toBeLessThanOrEqual(TRANSLATE_TOLERANCE);
    }
  });
});

type Order = 'write-then-cancel' | 'cancel-then-write';
const ORDERS: readonly Order[] = ['write-then-cancel', 'cancel-then-write'];

/** One channel of the S 10/10 holds: the property, the animated values, and how to read the component(s) of the property. */
interface Channel {
  property: 'scale' | 'translate';
  from: string;
  held: string;
  rest: readonly number[];
  heldValues: readonly number[];
  tolerance: number;
  measure: (element: HTMLElement) => number[];
}

const SCALE: Channel = {
  property: 'scale',
  from: '1',
  held: '1.04',
  rest: [1],
  heldValues: [1.04],
  tolerance: SCALE_TOLERANCE,
  measure: (element) => [scaleOf(read(element, 'scale'))[0]],
};

const TRANSLATE: Channel = {
  property: 'translate',
  from: '-50% 0px',
  held: '-50% 4px',
  rest: [-50, 0],
  heldValues: [-50, 4],
  tolerance: TRANSLATE_TOLERANCE,
  measure: (element) => translateOf(read(element, 'translate')),
};

interface HoldResult {
  holds: boolean;
  returned: boolean;
  transitions: number;
  held: number[][];
  path: number[][];
  left: number;
}

/**
 * (a) A WAAPI animation from rest to the held value ends; in one task its last value is written inline and it is cancelled, in the
 * given order; twenty frames are read. (b) On the same element, the inline value is removed and, in the same task, a one-keyframe
 * animation (offset 0) starts from the held value and goes to the rest.
 */
async function holdThenReturn(
  classes: string,
  channel: Channel,
  order: Order,
): Promise<HoldResult> {
  const element = box(classes);
  const hold = element.animate(
    [
      { [channel.property]: channel.from },
      { [channel.property]: channel.held },
    ],
    {
      duration: 200,
      easing: 'linear',
      fill: 'forwards',
    },
  );
  await hold.finished;
  if (order === 'write-then-cancel') {
    element.style.setProperty(channel.property, channel.held);
    hold.cancel();
  } else {
    hold.cancel();
    element.style.setProperty(channel.property, channel.held);
  }
  const held: number[][] = [];
  let transitions = 0;
  for (let frame = 0; frame < 20; frame++) {
    await nextFrame();
    held.push(channel.measure(element));
    transitions += element
      .getAnimations()
      .filter((animation) => animation instanceof CSSTransition).length;
  }
  const holds =
    held.every((values) =>
      isClose(values, channel.heldValues, channel.tolerance),
    ) && transitions === 0;

  element.style.removeProperty(channel.property);
  const back = element.animate(
    [{ [channel.property]: channel.held, offset: 0 }],
    {
      duration: 200,
      easing: 'linear',
      fill: 'none',
    },
  );
  const path: number[][] = [];
  do {
    await nextFrame();
    path.push(channel.measure(element));
  } while (back.playState !== 'finished' && path.length < 60);
  await nextFrame();
  path.push(channel.measure(element));

  const limits = channel.heldValues.map(
    (value, index) =>
      Math.abs(value - channel.rest[index]) / 2 + channel.tolerance,
  );
  const low = channel.rest.map(
    (value, index) =>
      Math.min(value, channel.heldValues[index]) - channel.tolerance,
  );
  const high = channel.rest.map(
    (value, index) =>
      Math.max(value, channel.heldValues[index]) + channel.tolerance,
  );
  const inRange = path.every((values) =>
    values.every((value, index) => value >= low[index] && value <= high[index]),
  );
  const noJump = path.every((values, index) => {
    const previous = index === 0 ? channel.heldValues : path[index - 1];
    return values.every(
      (value, component) =>
        Math.abs(value - previous[component]) <= limits[component],
    );
  });
  const atRest = isClose(
    path[path.length - 1],
    channel.rest,
    channel.tolerance,
  );
  const left = element.getAnimations().length;
  return {
    holds,
    returned: inRange && noJump && atRest && left === 0,
    transitions,
    held: held.map((values) => values.map(round)),
    path: path.map((values) => values.map(round)),
    left,
  };
}

const VARIANTS = [
  {
    name: 'transition: scale 200ms',
    classes: 'spike-s10-scale',
    channel: SCALE,
  },
  {
    name: 'Tailwind 4.3.3 transition-[translate,scale,rotate]',
    classes: 'spike-s10-tailwind',
    channel: SCALE,
  },
  { name: 'transition: all 200ms', classes: 'spike-s10-all', channel: SCALE },
  {
    name: '(c) transition: translate 200ms, rest translate -50% 0px',
    classes: 'spike-s10-rest-c spike-s10-translate',
    channel: TRANSLATE,
  },
  {
    name: '(c) Tailwind 4.3.3 transition-[translate,scale,rotate], rest translate -50% 0px',
    classes: 'spike-s10-rest-c spike-s10-tailwind',
    channel: TRANSLATE,
  },
  {
    name: '(c) transition: all 200ms, rest translate -50% 0px',
    classes: 'spike-s10-rest-c spike-s10-all',
    channel: TRANSLATE,
  },
];

describe('S 10/10 an inline hold against an author CSS transition', () => {
  for (const variant of VARIANTS) {
    it(
      variant.name,
      async () => {
        const results: Array<HoldResult & { order: Order }> = [];
        for (const order of ORDERS) {
          results.push({
            order,
            ...(await holdThenReturn(variant.classes, variant.channel, order)),
          });
        }
        record('S 10/10', variant.name, results);
        expect(
          results.some((result) => result.holds),
          'the hold holds in at least one order',
        ).toBe(true);
        for (const result of results) {
          if (result.holds)
            expect(result.returned, `the return, ${result.order}`).toBe(true);
        }
      },
      60_000,
    );
  }

  it('control: an inline change under transition: scale 200ms starts a CSS transition the detector sees', async () => {
    const element = box('spike-s10-scale');
    await nextFrame();
    element.style.setProperty('scale', '1.04');
    const samples: Array<{ scale: number; transitions: number }> = [];
    for (let frame = 0; frame < 12; frame++) {
      await nextFrame();
      samples.push({
        scale: round(scaleOf(read(element, 'scale'))[0]),
        transitions: element
          .getAnimations()
          .filter((animation) => animation instanceof CSSTransition).length,
      });
    }
    record(
      'S 10/10',
      'control: a plain inline change under transition: scale 200ms',
      samples,
    );
    expect(
      samples.some((sample) => sample.transitions > 0),
      'the detector sees the transition',
    ).toBe(true);
    expect(
      samples[0].scale,
      'the transition is visible in the first frame',
    ).toBeLessThan(1.04);
  }, 60_000);
});
