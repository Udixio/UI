import { ToolbarInterface } from '../interfaces';
import { type ClassNameComponent, cx, defaultClassNames } from '../utils';

const toolbarConfig: ClassNameComponent<ToolbarInterface> = ({
  variant,
  color,
  orientation,
}) => ({
  toolbar: cx(
    'flex items-center overflow-visible',
    orientation === 'vertical' ? 'flex-col' : 'h-16 flex-row',
    color === 'vibrant'
      ? 'bg-primary-container text-on-primary-container'
      : 'bg-surface-container text-on-surface',
    // Toolbar slots are 48dp targets. The descendant selectors keep direct
    // IconButton composition aligned with the Material 3 slot geometry.
    '[&>button]:min-h-12 [&>button]:min-w-12',
    '[&>a]:min-h-12 [&>a]:min-w-12',
    '[&>span>button]:min-h-12 [&>span>button]:min-w-12',
    '[&>span>a]:min-h-12 [&>span>a]:min-w-12',
    variant === 'docked'
      ? 'w-full justify-evenly gap-2 px-4 py-3 md:justify-center'
      : orientation === 'vertical'
        ? 'h-fit w-16 justify-center gap-1 rounded-[32px] px-3 py-2 shadow-3'
        : 'w-fit max-w-full justify-center gap-1 rounded-[32px] px-2 py-3 shadow-3',
  ),
});

export const toolbarStyle = defaultClassNames<ToolbarInterface>(
  'toolbar',
  toolbarConfig,
);
