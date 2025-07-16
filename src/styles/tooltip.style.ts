import { classNames, defaultClassNames } from '../utils';
import { ToolTipInterface } from '../interfaces/tooltip.interface';

export const toolStyle = defaultClassNames<ToolTipInterface>(
  'toolTip',
  ({ position, variant }) => ({
    toolTip: classNames(''),
    container: classNames(' w-fit   absolute  m-1 w-screen max-w-[312px]', {
      'bottom-full left-1/2 -translate-x-1/2': position == 'top',
      'top-full left-1/2 -translate-x-1/2': position == 'bottom',
      'right-full top-1/2 -translate-y-1/2': position == 'left',
      'left-full top-1/2 -translate-y-1/2': position == 'right',
      'bottom-full right-full': position == 'top-left',
      'bottom-full left-full': position == 'top-right',
      'top-full right-full': position == 'bottom-left',
      'top-full left-full': position == 'bottom-right',
    }),
    content: classNames(
      '  pb-2 ',
      variant == 'rich' &&
        'bg-surface-container rounded-2xl text-on-surface-container px-4 pt-3',
      variant == 'plain' &&
        'bg-inverse-surface rounded text-inverse-on-surface px-2 py-1'
    ),
    actions: classNames(
      'flex gap-10 px-1 mt-2',
      variant == 'plain' && 'hidden'
    ),
    subHead: classNames(
      'text-title-small mb-1',
      variant == 'plain' && 'hidden'
    ),
    supportingText: classNames(''),
  })
);
