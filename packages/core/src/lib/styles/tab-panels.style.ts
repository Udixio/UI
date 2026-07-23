import { TabPanelsInterface, TabPanelInterface } from '../interfaces';
import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';

const tabPanelsConfig: ClassNameComponent<TabPanelsInterface> = () => ({
  tabPanels: cx('overflow-hidden'),
});

export const tabPanelsStyle = defaultClassNames<TabPanelsInterface>(
  'tabPanels',
  tabPanelsConfig,
);

const tabPanelConfig: ClassNameComponent<TabPanelInterface> = () => ({
  tabPanel: cx(''),
});

export const tabPanelStyle = defaultClassNames<TabPanelInterface>(
  'tabPanel',
  tabPanelConfig,
);
