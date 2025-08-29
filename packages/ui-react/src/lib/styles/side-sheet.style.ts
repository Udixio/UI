import { classNames, defaultClassNames } from '../utils';
import { SideSheetInterface } from '../interfaces/side-sheet.interface';

export const sideSheetStyle = defaultClassNames<SideSheetInterface>(
  'slideSheet',
  ({ variant, position }) => ({
    slideSheet: classNames(
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
    container: classNames('w-full overflow-hidden', {}),
    content: classNames('w-fit '),
    header: classNames('p-4 flex items-center gap-2'),
    title: classNames('text-on-surface-variant text-title-large'),
    closeButton: classNames('ml-auto'),
    divider: classNames({ hidden: variant == 'modal' }),
    overlay: classNames(
      'bg-[black]/[0.32] fixed top-0 left-0 w-screen h-screen',
    ),
  }),
);
