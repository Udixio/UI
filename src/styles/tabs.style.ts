import {
  TabsBaseProps,
  TabsElements,
  TabsStates,
} from '../interfaces/tabs.interface';
import { classNames, defaultClassNames } from '../utils';

export const tabsStyle = defaultClassNames<
  TabsBaseProps & TabsStates,
  TabsElements
>({
  defaultClassName: ({ scrollable }) => ({
    tabs: classNames(
      'border-b border-surface-container-highest',
      'flex relative ',
      { 'overflow-x-auto': scrollable }
    ),
  }),
  default: 'tabs',
});
