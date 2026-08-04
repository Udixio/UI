import { TabsInterface } from '../interfaces';
import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';

const tabsConfig: ClassNameComponent<TabsInterface> = ({
  scrollable,
  variant,
}) => ({
  tabs: cx(
    'border-b border-surface-container-highest bg-surface',
    'flex relative ',
    { 'overflow-x-auto': scrollable },
  ),
  indicator: cx(
    'absolute left-0 bottom-0 bg-primary pointer-events-none',
    variant === 'primary' && 'h-[3px] rounded-t',
    variant === 'secondary' && 'h-0.5',
  ),
});

export const tabsStyle = defaultClassNames<TabsInterface>('tabs', tabsConfig);
