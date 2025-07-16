import { classNames, defaultClassNames } from '../utils';
import { ToolTipInterface } from '../interfaces/tooltip.interface';

export const toolStyle = defaultClassNames<ToolTipInterface>(
  'toolTip',
  ({ position }) => ({
    toolTip: classNames(),
    container: classNames(
      'bg-surface-container w-fit py-3 px-4 absolute rounded-2xl',
      {
        'bottom-full left-1/2 -translate-x-1/2': position == 'top',
        'top-full left-1/2 -translate-x-1/2': position == 'bottom',
        'right-full top-1/2 -translate-y-1/2': position == 'left',
        'left-full top-1/2 -translate-y-1/2': position == 'right',
        'bottom-full right-full': position == 'top-left',
        'bottom-full left-full': position == 'top-right',
        'top-full right-full': position == 'bottom-left',
        'top-full left-full': position == 'bottom-right',
      }
    ),
    actions: classNames('flex gap-10 px-1'),
    subHead: classNames('text-title-small mb-1'),
    supportingText: classNames('mb-2'),
  })
);
