import { TabsInterface } from '../interfaces/tabs.interface';
import { classNames, defaultClassNames } from '../utils';

export const tabsStyle = defaultClassNames<TabsInterface>(
  'tabs',
  ({ scrollable }) => ({
    tabs: classNames(
      'border-b border-surface-container-highest',
      'flex relative ',
      { 'overflow-x-auto': scrollable }
    ),
  })
);
