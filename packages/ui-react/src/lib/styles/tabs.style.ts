import { TabsInterface } from '../interfaces';
import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';

const tabsConfig: ClassNameComponent<TabsInterface> = ({ scrollable }) => ({
  tabs: classNames(
    'border-b border-surface-container-highest bg-surface',
    'flex relative ',
    { 'overflow-x-auto': scrollable },
  ),
});

export const tabsStyle = defaultClassNames<TabsInterface>('tabs', tabsConfig);

export const useTabsStyle = createUseClassNames<TabsInterface>(
  'tabs',
  tabsConfig,
);
