import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';
import { TooltipInterface } from '../interfaces';

const tooltipConfig: ClassNameComponent<TooltipInterface> = ({
  variant,
}) => ({
  // No position-dependent placement classes here: `AnchorPositioner`
  // positions its wrapper directly (native CSS Anchor Positioning or the
  // `getBoundingClientRect` fallback), so the surface itself only needs its
  // own visual box, not an `absolute`/`bottom-full`-style offset computed
  // against a same-size-as-anchor ancestor.
  toolTip: cx(
    'pointer-events-auto w-max z-10 m-1 w-max-content max-w-[312px]',
    variant == 'rich' &&
      'bg-surface-container rounded-2xl text-on-surface-container shadow-2',
    variant == 'plain' && 'bg-inverse-surface rounded text-inverse-on-surface ',
  ),
  container: cx(
    'pb-2',
    variant == 'rich' && 'px-4 pt-3 ',
    variant == 'plain' && 'px-2 py-1',
  ),
  // Material 3 gives the rich tooltip a single action slot, so it specifies no
  // gap between two of them; accepting several is our own extension and 8px is
  // our choice. The wrapper adds no horizontal padding of its own: the actions
  // sit on the container's 16px edge, and `edgeAligned` on each button cancels
  // its own padding so the label lines up with the supporting text.
  actions: cx('flex gap-2 mt-2', variant == 'plain' && 'hidden'),
  subHead: cx('text-title-small mb-1', variant == 'plain' && 'hidden'),
  supportingText: cx(''),
  content: cx('w-full'),
});

export const tooltipStyle = defaultClassNames<TooltipInterface>(
  'toolTip',
  tooltipConfig,
);
