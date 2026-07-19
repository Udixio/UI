import { type ClassNameComponent, classNames, defaultClassNames } from '../utils';
import { MenuHeadlineInterface } from '../interfaces/menu-headline.interface';

const menuHeadlineConfig: ClassNameComponent<MenuHeadlineInterface> = ({
  variant,
}) => ({
  headline: classNames('px-3 py-1 text-label-small opacity-60 mt-1', {
    'text-on-surface-variant': !variant || variant === 'standard',
    // Vibrant treatment if different
  }),
});

export const menuHeadlineStyle = defaultClassNames<MenuHeadlineInterface>(
  'headline',
  menuHeadlineConfig,
);
