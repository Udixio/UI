import { TabPanelsInterface, TabPanelInterface } from '../interfaces';
import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';

const tabPanelsConfig: ClassNameComponent<TabPanelsInterface> = () => ({
  tabPanels: classNames('overflow-hidden'),
});

export const tabPanelsStyle = defaultClassNames<TabPanelsInterface>(
  'tabPanels',
  tabPanelsConfig,
);

export const useTabPanelsStyle = createUseClassNames<TabPanelsInterface>(
  'tabPanels',
  tabPanelsConfig,
);

const tabPanelConfig: ClassNameComponent<TabPanelInterface> = () => ({
  tabPanel: classNames(''),
});

export const tabPanelStyle = defaultClassNames<TabPanelInterface>(
  'tabPanel',
  tabPanelConfig,
);

export const useTabPanelStyle = createUseClassNames<TabPanelInterface>(
  'tabPanel',
  tabPanelConfig,
);
