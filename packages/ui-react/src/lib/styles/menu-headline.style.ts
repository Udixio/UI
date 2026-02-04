
import { type ClassNameComponent, classNames, defaultClassNames, createUseClassNames } from '../utils';

export interface MenuHeadlineInterface {
    label?: string;
    variant?: 'standard' | 'vibrant';
    type: 'div';
    props: { label?: string; variant?: 'standard' | 'vibrant' };
    states: Record<string, any>;
    elements: ['headline'];
}

const menuHeadlineConfig: ClassNameComponent<MenuHeadlineInterface> = ({ props }) => ({
  headline: classNames('px-3 py-1 text-label-small opacity-60 mt-1', {
      'text-on-surface-variant': !props?.variant || props.variant === 'standard',
       // Vibrant treatment if different
  }),
});

export const useMenuHeadlineStyle = createUseClassNames<MenuHeadlineInterface>('menu-headline', menuHeadlineConfig);
