import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';

import { SideSheetInterface } from '../interfaces';

export const sideSheetConfig: ClassNameComponent<SideSheetInterface> = ({
  variant,
  position,
}) => ({
  sideSheet: cx(
    'bg-surface flex justify-between  max-w-xs z-10',
    {
      'flex-row-reverse': position == 'right',
      'h-full': variant == 'standard',
    },
    variant == 'modal' && [
      'rounded-2xl fixed top-0 m-[1rem] h-[calc(100dvh-2rem)]',
      {
        'right-0': position == 'right',
        'left-0': position == 'left',
      },
    ],
  ),
  container: cx('w-full overflow-hidden flex flex-col', {}),
  header: cx('p-4 flex items-center gap-2'),
  content: cx('flex-1 overflow-y-auto'),
  title: cx('text-on-surface-variant text-title-large'),
  closeButton: cx('ml-auto'),
  divider: cx({ hidden: variant == 'modal' }),
  overlay: cx('bg-[black]/[0.32] fixed top-0 left-0 w-screen h-screen'),
});

export const sideSheetStyle = defaultClassNames<SideSheetInterface>(
  'sideSheet',
  sideSheetConfig,
);
