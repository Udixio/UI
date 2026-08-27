import { type ClassNameComponent, cx, defaultClassNames } from '../utils';
import type { FabInterface } from '../interfaces/fab.interface';
import { FAB_MOTION_TIMING_CLASS } from '../fab-motion';

const fabConfig: ClassNameComponent<FabInterface> = ({
  size,
  variant,
  extended,
  disabled,
}) => ({
  fab: cx(
    'relative inline-flex shrink-0 items-center justify-center overflow-hidden outline-none group/fab',
    // `createFabLabelController` diffs the label's `width: 0` <-> `auto` with
    // Anime.js Layout; the padding and gap below flip between two concrete
    // values, so they only need a CSS transition -- matched to that
    // controller's duration and easing (Motion's default tween curve, which
    // this transition used before it moved to Anime.js) so the pill grows as
    // one shape.
    'transition-[padding,column-gap]',
    FAB_MOTION_TIMING_CLASS,
    'shadow-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
    disabled ? 'cursor-default shadow-none' : 'cursor-pointer hover:shadow-4',
    // Sizes follow the current Material 3 scale (Compose's `Fab*Tokens` and
    // `ExtendedFab*Tokens`): 56 / 80 / 96 containers, 24 / 28 / 36 icons,
    // corner-large / -large-increased / -extra-large, and, once extended,
    // 16 / 26 / 28 of horizontal padding around an 8 / 16 / 20 gap.
    //
    // The large icon is 36 rather than the 32 its token carries: Compose
    // hardcodes `LargeIconSize = 36.dp` with `// TODO: FabLargeTokens.IconSize
    // is incorrect`, so the token is the outlier, not the implementation.
    //
    // The height is declared rather than left to `icon + padding`: the label
    // is always mounted, so a content-derived height would be dictated by
    // whichever child is tallest -- the label's line box, not the icon -- and
    // a compact fab would stop being square. `shrink-0` above keeps it from
    // being squashed below that by a flex parent, which is what the old
    // `min-w-12` floor was really doing.
    //
    // The width, on the other hand, stays content-derived in both states:
    // a compact fab is square because its padding is exactly half the
    // difference between its height and its icon ((56-24)/2, (80-28)/2,
    // (96-36)/2). Pinning it instead would make the pill jump to its final
    // width the moment `extended` flips, since a fixed width cannot be
    // transitioned from `auto` -- the label would then collapse inside a box
    // that had already resized.
    size === 'small' && 'h-14 rounded-[16px] px-4',
    size === 'medium' && 'h-20 rounded-[20px] px-[26px]',
    size === 'large' && 'h-24 rounded-[28px] px-[30px]',
    extended && {
      'gap-2 px-4': size === 'small',
      'gap-4 px-[26px]': size === 'medium',
      'gap-5 px-7': size === 'large',
    },
    variant === 'primary' && 'bg-primary text-on-primary',
    variant === 'secondary' && 'bg-secondary text-on-secondary',
    variant === 'tertiary' && 'bg-tertiary text-on-tertiary',
    variant === 'primaryContainer' &&
      'bg-primary-container text-on-primary-container',
    variant === 'secondaryContainer' &&
      'bg-secondary-container text-on-secondary-container',
    variant === 'tertiaryContainer' &&
      'bg-tertiary-container text-on-tertiary-container',
    disabled && 'bg-on-surface/[0.12] text-on-surface/[0.38]',
  ),
  touchTarget: cx(
    'pointer-events-none absolute left-1/2 top-1/2 h-12 min-w-12 w-full -translate-x-1/2 -translate-y-1/2',
  ),
  stateLayer: cx('overflow-hidden'),
  icon: cx(
    'pointer-events-none shrink-0',
    size === 'small' && 'size-6',
    size === 'medium' && 'size-7',
    size === 'large' && 'size-9',
  ),
  label: cx(
    // The width and opacity are owned by `createFabLabelController`: Anime.js
    // Layout diffs both, and needs the change to happen between its own
    // record/animate pair. The adapters render the matching resting values as
    // an inline style so first paint is already correct.
    //
    // Deliberately *not* clipped here: as the label narrows, its text has to
    // overflow its own box and stay visible until the shrinking pill passes
    // over it, so it reads as sliding behind the edge. Clipping it at the
    // label instead cuts the text off a whole padding width short of that
    // edge, which looks like the text is being severed in mid-air. The pill's
    // own `overflow-hidden` above is what does the clipping, and a compact
    // label is fully transparent, so nothing overflows at rest.
    'text-nowrap',
    size === 'small' && 'text-title-medium',
    size === 'medium' && 'text-title-large',
    size === 'large' && 'text-headline-small',
  ),
});

export const fabStyle = defaultClassNames<FabInterface>('fab', fabConfig);
