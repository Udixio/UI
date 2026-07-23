import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';
import { TooltipInterface } from '../interfaces';

const tooltipConfig: ClassNameComponent<TooltipInterface> = ({
  position,
  variant,
}) => ({
  toolTip: cx(
    ' pointer-events-auto w-max z-10  absolute  m-1 w-max-content max-w-[312px]',
    variant == 'rich' &&
      'bg-surface-container rounded-2xl text-on-surface-container shadow-2',
    variant == 'plain' && 'bg-inverse-surface rounded text-inverse-on-surface ',
    {
      'bottom-full left-1/2 -translate-x-1/2': position == 'top',
      'top-full left-1/2 -translate-x-1/2': position == 'bottom',
      'right-full top-1/2 -translate-y-1/2': position == 'left',
      'left-full top-1/2 -translate-y-1/2': position == 'right',
      'bottom-full right-full': position == 'top-left',
      'bottom-full left-full': position == 'top-right',
      'top-full right-full': position == 'bottom-left',
      'top-full left-full': position == 'bottom-right',
    },
  ),
  container: cx(
    'pb-2',
    variant == 'rich' && 'px-4 pt-3 ',
    variant == 'plain' && 'px-2 py-1',
  ),
  actions: cx('flex gap-10 px-1 mt-2', variant == 'plain' && 'hidden'),
  subHead: cx('text-title-small mb-1', variant == 'plain' && 'hidden'),
  supportingText: cx(''),
  content: cx('w-full'),
});

export const tooltipStyle = defaultClassNames<TooltipInterface>(
  'toolTip',
  tooltipConfig,
);
