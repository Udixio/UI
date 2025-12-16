import type { ClassNameComponent } from '../utils';
import { classNames, createUseClassNames, defaultClassNames } from '../utils';
import { ChipsInterface } from '../interfaces';

const chipsConfig: ClassNameComponent<ChipsInterface> = ({ scrollable }) => ({
  chips: classNames(' flex  gap-3 outline-none', {
    'flex-wrap': !scrollable,
    'overflow-x-auto pr-[40%]': scrollable,
  }),
});

export const chipsStyle = defaultClassNames<ChipsInterface>(
  'chips',
  chipsConfig,
);

export const useChipsStyle = createUseClassNames<ChipsInterface>(
  'chips',
  chipsConfig,
);
