import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';
import { FabMenuInterface } from '../interfaces/fab-menu.interface';

const fabMenuConfig: ClassNameComponent<FabMenuInterface> = ({
  size,
  variant,
  open,
}) => ({
  fabMenu: classNames('relative inline-flex flex-col items-end'),
  actions: classNames(
    'flex flex-col gap-1 items-end absolute bottom-[calc(100%_+_8px)] right-0',
    !open && 'hidden',
  ),
});

export const fabMenuStyle = defaultClassNames<FabMenuInterface>(
  'fabMenu',
  fabMenuConfig,
);

export const useFabMenuStyle = createUseClassNames<FabMenuInterface>(
  'fabMenu',
  fabMenuConfig,
);
