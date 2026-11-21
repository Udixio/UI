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
    'bg-surface flex justify-between overflow-hidden max-w-xs',
    {
      'flex-row-reverse': position == 'right',
      'h-full': variant == 'standard',
      // A modal sheet layers above the page chrome, which sits at z-20 in the documentation, and above its backdrop.
      'z-50': variant == 'modal',
      'z-10': variant == 'standard',
    },
    variant == 'modal' && [
      'rounded-2xl fixed top-[1rem] bottom-[1rem] mx-[1rem]',
      {
        'right-0': position == 'right',
        'left-0': position == 'left',
      },
    ],
  ),
  container: cx('flex-1 min-w-0 overflow-hidden flex flex-col', {}),
  header: cx('p-4 flex items-center gap-2'),
  content: cx('flex-1 overflow-y-auto'),
  title: cx('text-on-surface-variant text-title-large'),
  closeButton: cx('ml-auto'),
  divider: '',
  overlay: cx('bg-[black]/[0.32] fixed inset-0 z-40'),
});

export const sideSheetStyle = defaultClassNames<SideSheetInterface>(
  'sideSheet',
  sideSheetConfig,
);
