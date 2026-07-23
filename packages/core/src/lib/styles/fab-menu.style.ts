import {
  type ClassNameComponent,
  classNames,
  defaultClassNames,
} from '../utils';
import type { FabMenuInterface } from '../interfaces/fab-menu.interface';

const fabMenuConfig: ClassNameComponent<FabMenuInterface> = ({ disabled }) => ({
  fabMenu: classNames('relative inline-flex flex-col items-end'),
  fab: classNames(disabled && 'pointer-events-none'),
  actions: classNames(
    'absolute bottom-[calc(100%_+_8px)] right-0 z-10 flex min-w-max flex-col items-end gap-2',
  ),
  action: classNames('max-w-full text-nowrap'),
});

export const fabMenuStyle = defaultClassNames<FabMenuInterface>(
  'fabMenu',
  fabMenuConfig,
);
