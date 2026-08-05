import { type ClassNameComponent, cx, defaultClassNames } from '../utils';
import { SwitchInterface } from '../interfaces';

const switchConfig: ClassNameComponent<SwitchInterface> = ({
  isChecked,
  disabled,
  inactiveIcon,
}) => ({
  switch: cx(
    'group/switch relative inline-flex h-[32px] w-[52px] shrink-0 items-center rounded-full border-2 outline-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    disabled
      ? // `pointer-events-none` (not just the `disabled`/`aria-disabled` JS
        // gating in switch.behavior.ts) is required to suppress the state
        // layer's hover ripple: `.switch` is a `<div>`, which can never
        // match the CSS `:disabled` pseudo-class that `group-disabled/…`
        // relies on (that variant only ever matches real form controls), so
        // without this, a disabled switch is still fully `:hover`-able.
        'pointer-events-none cursor-default bg-on-surface/[0.12] border-transparent'
      : [
          'cursor-pointer',
          isChecked
            ? 'bg-primary border-primary'
            : 'bg-surface-container border-outline',
        ],
  ),
  // A fixed 28px box (the handle's own largest, pressed size) at a fixed
  // `left-0`; the adapter applies the actual resting offset as an inline
  // `translate` (from `getSwitchHandleOffset`), not as a `left`/`right`
  // class, so the Anime.js tween controller (switch.ts) has a single numeric
  // CSS property to animate between the two known resting offsets (see
  // switch.behavior.ts).
  handleContainer: cx('absolute left-0 size-7'),
  // Centered inside `handleContainer` independently of its own current size,
  // so `group-active/switch:size-7` (a pure `:active` pseudo-class effect,
  // with no JS state to recompute an offset from) grows the handle from a
  // fixed center point instead of shifting it -- growth from only a
  // `left`-anchored edge is not growth from the center.
  handle: cx(
    'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full transition-[width,height] duration-100',
    !isChecked && !inactiveIcon ? 'size-4' : 'size-6',
    !disabled && [
      'group-active/switch:size-7',
      isChecked
        ? 'bg-on-primary group-hover/switch:bg-primary-container'
        : 'bg-outline group-hover/switch:bg-on-surface-variant',
    ],
    disabled && 'bg-surface',
  ),
  // Sized to the standard 40px Material touch/state-layer target, deliberately
  // larger than -- and decoupled from -- `handleContainer` (which stays sized
  // to `handle`), so it can overflow it and stay statically centered on the
  // handle regardless of `handleContainer`'s own (handle-driven) size.
  stateLayer: cx(
    'absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full',
  ),
  icon: cx(
    'size-4',
    !disabled && [isChecked ? 'text-on-primary-container' : 'text-on-primary'],
    disabled && 'text-on-surface/[0.38]',
  ),
});

export const switchStyle = defaultClassNames<SwitchInterface>(
  'switch',
  switchConfig,
);
