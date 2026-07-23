import { TabsInterface } from '../interfaces';
import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';

const tabsConfig: ClassNameComponent<TabsInterface> = ({ scrollable }) => ({
  tabs: cx(
    'border-b border-surface-container-highest bg-surface',
    'flex relative ',
    { 'overflow-x-auto': scrollable },
  ),
});

export const tabsStyle = defaultClassNames<TabsInterface>('tabs', tabsConfig);
