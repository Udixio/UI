import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';
import { MenuGroupInterface } from '../interfaces/menu-group.interface';

const menuGroupConfig: ClassNameComponent<MenuGroupInterface> = ({
  variant,
}) => ({
  menuGroup: classNames(
    'flex flex-col gap-0.5 mb-0.5 last:mb-0',
    'rounded-lg py-0.5 px-1 shadow-2 first:rounded-t-2xl last:rounded-b-2xl',
    {
      'bg-surface-container': variant === 'standard',
      'bg-tertiary-container text-on-tertiary-container': variant === 'vibrant',
    },
  ),
  groupLabel: classNames('px-3 pt-2  text-label-small tracking-wide ', {
    'text-on-surface-variant': variant === 'standard',
    'text-on-tertiary-container opacity-80': variant === 'vibrant',
  }),
});

export const menuGroupStyle = defaultClassNames<MenuGroupInterface>(
  'menuGroup',
  menuGroupConfig,
);

export const useMenuGroupStyle = createUseClassNames<MenuGroupInterface>(
  'menuGroup',
  menuGroupConfig,
);
