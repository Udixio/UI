import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';
import type { FabMenuInterface } from '../interfaces/fab-menu.interface';

const fabMenuConfig: ClassNameComponent<FabMenuInterface> = ({ disabled }) => ({
  fabMenu: cx('relative inline-flex flex-col items-end'),
  fab: cx(disabled && 'pointer-events-none'),
  actions: cx(
    'absolute bottom-[calc(100%_+_8px)] right-0 z-10 flex min-w-max flex-col items-end gap-2',
  ),
  action: cx('max-w-full text-nowrap'),
});

export const fabMenuStyle = defaultClassNames<FabMenuInterface>(
  'fabMenu',
  fabMenuConfig,
);
