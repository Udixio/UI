import type { ClassNameComponent } from '../utils';
import { classNames, defaultClassNames } from '../utils';
import { ChipsInterface } from '../interfaces';

const chipsConfig: ClassNameComponent<ChipsInterface> = ({ scrollable }) => ({
  chips: classNames(' flex  gap-3 outline-none', {
    'flex-wrap': !scrollable,
    'overflow-x-auto': scrollable,
  }),
});

export const chipsStyle = defaultClassNames<ChipsInterface>(
  'chips',
  chipsConfig,
);
