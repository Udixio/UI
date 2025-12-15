import type { ClassNameComponent } from '../utils';
import { classNames, createUseClassNames, defaultClassNames } from '../utils';
import { ChipsInterface } from '../interfaces';

const chipsConfig: ClassNameComponent<ChipsInterface> = ({ variant }) => ({
  chips: classNames(' flex flex-wrap gap-3'),
});

export const chipsStyle = defaultClassNames<ChipsInterface>(
  'chips',
  chipsConfig,
);

export const useChipsStyle = createUseClassNames<ChipsInterface>(
  'chips',
  chipsConfig,
);
