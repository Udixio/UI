import { describe, expect, it } from 'vitest';
import { resolveWaapiTiming } from '../play.js';
import {
  expectNoJump,
  jumpStats,
  sampleFrames,
  type Sample,
} from './no-jump.js';

/** The frame at which the injected jump is written: the tenth. */
const INJECT_FRAME = 10;
/** The injected jump, in scale units: 5 px on a 200 px element (spec §7). */
const INJECTED_JUMP = 0.02;
/** The scale a hover reaches at rest. */
const HOVER_SCALE = 1.04;
/** The frame length used to size the sampling; the reads themselves follow requestAnimationFrame. */
const FRAME_MS = 16;
/** Frames sampled after the duration, so that the value has settled. */
const TAIL_FRAMES = 10;

type SpringToken = 'spring.fast.spatial' | 'spring.default.spatial';

/** The browser that runs the case, read from its user agent, for the log. */
function engineName(): string {
  const agent = navigator.userAgent;
  if (agent.includes('Firefox/')) return 'firefox';
  if (agent.includes('Chrome/')) return 'chromium';
  if (agent.includes('Safari/')) return 'webkit';
  return 'unknown';
}

/** The scale of an element; both axes are equal in these transitions, so the first value is the scale. */
function readScale(element: HTMLElement): number {
  return parseFloat(getComputedStyle(element).getPropertyValue('scale'));
}

/**
 * Plays one plain WAAPI `scale` transition from `from` to `to`, lasting the spring's duration times `scale`, and samples it
 * at each frame. With `inject`, the tenth frame is replaced by script: the value read there, plus 0.02, is written inline and the
 * animation is cancelled.
 */
async function transition(
  token: SpringToken,
  from: number,
  to: number,
  scale: number,
  inject: boolean,
): Promise<Sample[]> {
  const element = document.createElement('div');
  element.style.width = '200px';
  element.style.height = '120px';
  document.body.append(element);
  try {
    const route = resolveWaapiTiming(element, token, 'expressive');
    if (route === null)
      throw new Error(`${token} has no route in this browser`);
    const duration = route.duration * scale;
    const animation = element.animate(
      { scale: [String(from), String(to)] },
      { duration, easing: route.easing, fill: 'both' },
    );
    let frame = 0;
    const read = (): number => {
      frame += 1;
      const value = readScale(element);
      if (inject && frame === INJECT_FRAME) {
        animation.pause();
        element.style.setProperty('scale', String(value + INJECTED_JUMP));
        animation.cancel();
      }
      return value;
    };
    return await sampleFrames(
      read,
      Math.ceil(duration / FRAME_MS) + TAIL_FRAMES,
    );
  } finally {
    for (const animation of element.getAnimations()) animation.cancel();
    element.remove();
  }
}

describe('the "no jump" helper, calibrated on plain WAAPI transitions', () => {
  const engine = engineName();

  for (const token of [
    'spring.fast.spatial',
    'spring.default.spatial',
  ] as const) {
    for (const scale of [1, 4]) {
      it(`reports no jump on a hover and a return to rest with ${token} at a scale of ${scale}`, async () => {
        const hover = await transition(token, 1, HOVER_SCALE, scale, false);
        const back = await transition(token, HOVER_SCALE, 1, scale, false);
        console.info({
          engine,
          case: `hover ${token} x${scale}`,
          ...jumpStats(hover),
        });
        console.info({
          engine,
          case: `return ${token} x${scale}`,
          ...jumpStats(back),
        });
        expectNoJump(hover, 'scale');
        expectNoJump(back, 'scale');
      });
    }
  }

  it(`reports an injected jump of ${INJECTED_JUMP} of a scale`, async () => {
    const samples = await transition(
      'spring.fast.spatial',
      1,
      HOVER_SCALE,
      1,
      true,
    );
    console.info({
      engine,
      case: 'injected spring.fast.spatial x1',
      ...jumpStats(samples),
    });
    expect(() => expectNoJump(samples, 'scale')).toThrow(/frame/);
    expect(jumpStats(samples).maxMove).toBeGreaterThanOrEqual(INJECTED_JUMP);
  });
});
