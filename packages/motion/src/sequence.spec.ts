import { describe, expect, it, vi } from 'vitest';
import { defineSequence, onSequenceDefined, resolveSequence } from './sequence.js';

const frames = [{ opacity: 0 }, { opacity: 1 }];

describe('defineSequence', () => {
  it('returns a frozen reference that resolveSequence returns unchanged, with the appear verb by default', () => {
    const ref = defineSequence('seq-plain', {
      steps: { title: { keyframes: frames }, subtitle: { keyframes: frames, at: '+=normal' } },
    });
    expect(ref.name).toBe('seq-plain');
    expect(ref.spec.verb).toBe('appear');
    expect(Object.isFrozen(ref)).toBe(true);
    expect(resolveSequence('seq-plain')).toBe(ref);
  });

  it('keeps the reveal verb', () => {
    const ref = defineSequence('seq-view', { verb: 'reveal', steps: { title: { keyframes: frames } } });
    expect(ref.spec.verb).toBe('reveal');
  });

  it('accepts an at naming an earlier step, and each stagger token', () => {
    expect(() =>
      defineSequence('seq-at-earlier', {
        steps: {
          title: { keyframes: frames },
          subtitle: { keyframes: frames, at: 'title' },
          actions: { keyframes: frames, at: '+=tight' },
          footer: { keyframes: frames, at: '+=loose' },
        },
      }),
    ).not.toThrow();
  });

  it('refuses an at naming a later step', () => {
    expect(() =>
      defineSequence('seq-at-later', {
        steps: {
          title: { keyframes: frames, at: 'subtitle' },
          subtitle: { keyframes: frames },
        },
      }),
    ).toThrow(/\/steps\/title\/at: invalid_value/);
  });

  it('refuses an at naming the step itself, or an unknown step', () => {
    expect(() =>
      defineSequence('seq-at-self', {
        steps: { title: { keyframes: frames, at: 'title' } },
      }),
    ).toThrow(/\/steps\/title\/at: invalid_value/);
    expect(() =>
      defineSequence('seq-at-unknown', {
        steps: { title: { keyframes: frames }, subtitle: { keyframes: frames, at: 'missing' } },
      }),
    ).toThrow(/\/steps\/subtitle\/at: invalid_value/);
  });

  it('refuses an at that is neither a step name nor a stagger token', () => {
    expect(() =>
      defineSequence('seq-at-token', {
        steps: { title: { keyframes: frames }, subtitle: { keyframes: frames, at: '+=huge' } },
      }),
    ).toThrow(/\/steps\/subtitle\/at: invalid_value/);
  });

  it('refuses a step with invalid keyframes, and names the step in the path', () => {
    expect(() =>
      defineSequence('seq-empty-frames', {
        steps: { title: { keyframes: [] } },
      }),
    ).toThrow(/\/steps\/title\/keyframes: empty/);
  });

  it('refuses a field a step does not take', () => {
    expect(() =>
      defineSequence('seq-step-repeat', {
        steps: { title: { keyframes: frames, repeat: 'always' } as never },
      }),
    ).toThrow(/\/steps\/title\/repeat: unsupported/);
  });

  it('refuses a verb other than appear or reveal, and a sequence without steps', () => {
    expect(() => defineSequence('seq-bad-verb', { verb: 'emphasize', steps: { title: { keyframes: frames } } } as never)).toThrow(/\/verb: invalid_value/);
    expect(() => defineSequence('seq-no-steps', { steps: {} })).toThrow(/\/steps: empty/);
  });

  it('refuses names that are not kebab-case or are reserved, for the sequence and for each step', () => {
    for (const name of ['HeroIn', 'enter', '']) {
      expect(() => defineSequence(name, { steps: { title: { keyframes: frames } } })).toThrow(TypeError);
    }
    expect(() => defineSequence('seq-bad-step', { steps: { Title: { keyframes: frames } } })).toThrow(/\/steps\/Title: invalid_value/);
  });

  it('returns the same reference for an identical redefinition, and throws for a different spec', () => {
    const first = defineSequence('seq-same', { steps: { title: { keyframes: frames } } });
    expect(defineSequence('seq-same', { steps: { title: { keyframes: [{ opacity: 0 }, { opacity: 1 }] } } })).toBe(first);
    expect(() => defineSequence('seq-same', { steps: { title: { keyframes: [{ opacity: 0.5 }] } } })).toThrow(/seq-same/);
  });

  it('compares a redefinition by structure, as a motion: object timings, keys in any order', () => {
    const spec = () => ({
      steps: {
        title: {
          keyframes: [{ opacity: 0, y: 12 }, { opacity: 1, y: 0 }],
          timing: { duration: 'duration.extraLong2' as const, easing: 'easing.standard' as const },
        },
        body: { keyframes: frames, timing: { duration: 300, easing: 'ease-out' }, at: '+=normal' },
      },
    });
    const first = defineSequence('seq-same-timing', spec());
    expect(defineSequence('seq-same-timing', spec())).toBe(first);
    expect(
      defineSequence('seq-same-timing', {
        verb: 'appear',
        steps: {
          title: {
            timing: { easing: 'easing.standard', duration: 'duration.extraLong2' },
            keyframes: [{ y: 12, opacity: 0 }, { y: 0, opacity: 1 }],
          },
          body: { at: '+=normal', timing: { easing: 'ease-out', duration: 300 }, keyframes: frames },
        },
      }),
    ).toBe(first);
    expect(() =>
      defineSequence('seq-same-timing', {
        steps: { ...spec().steps, body: { ...spec().steps.body, timing: { duration: 301, easing: 'ease-out' } } },
      }),
    ).toThrow(/seq-same-timing/);
  });

  it('notifies listeners of each new definition until unsubscribed', () => {
    const seen: string[] = [];
    const listener = vi.fn((ref: { name: string }) => seen.push(ref.name));
    const unsubscribe = onSequenceDefined(listener);
    defineSequence('seq-listened-one', { steps: { title: { keyframes: frames } } });
    unsubscribe();
    defineSequence('seq-listened-two', { steps: { title: { keyframes: frames } } });
    expect(seen).toEqual(['seq-listened-one']);
  });
});
