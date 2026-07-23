import type { ClassNameComponent } from '../utils';
import { cx, defaultClassNames } from '../utils';
import { ChipsInterface } from '../interfaces';

const chipsConfig: ClassNameComponent<ChipsInterface> = ({ scrollable }) => ({
  chips: cx(' flex  gap-3 outline-none', {
    'flex-wrap': !scrollable,
    'overflow-x-auto': scrollable,
  }),
});

export const chipsStyle = defaultClassNames<ChipsInterface>(
  'chips',
  chipsConfig,
);
