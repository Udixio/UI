import { type ReactNode, useId, useMemo, useRef } from 'react';
import type { ReactProps, TabGroupInterface } from '@udixio/core';
import { useControllableState } from '../utils/use-controllable-state';
import { TabGroupContext, type TabGroupContextValue } from './TabGroupContext';

export type ReactTabGroupProps = ReactProps<TabGroupInterface> & {
  children?: ReactNode;
  onSelectedTabChange?: (index: number | null) => void;
};

/**
 * TabGroup shares selection state between a `Tabs` tablist and a `TabPanels`
 * placed anywhere in its subtree.
 * @status beta
 * @parent Tabs
 * @category Navigation
 * @devx
 * - Wrap `Tabs` and `TabPanels` in a `TabGroup` to connect them; `Tabs` alone
 *   (no `TabGroup`) is enough for a navigation-only tab list with no panels.
 * - Use `selectedTab`/`onSelectedTabChange` for controlled selection, or
 *   `defaultSelectedTab` (defaults to `0`) when uncontrolled.
 * @a11y
 * - Renders no DOM element and no ARIA role itself; the `tablist`/`tab`/
 *   `tabpanel` roles live on the connected `Tabs`/`Tab`/`TabPanel`.
 * @limitations
 * - No URL/hash syncing or persistence built in.
 */
export const TabGroup = ({
  children,
  selectedTab,
  defaultSelectedTab = 0,
  onSelectedTabChange,
}: ReactTabGroupProps) => {
  const [resolvedSelectedTab, setSelectedTab] = useControllableState({
    value: selectedTab,
    defaultValue: defaultSelectedTab,
    onChange: onSelectedTabChange,
    componentName: 'TabGroup',
    stateName: 'selectedTab',
  });

  // Tracks the previous selection (mutated during render, not in an effect)
  // so the very next render already knows the slide direction -- an effect
  // would only learn it a frame late, after TabPanels already animated.
  const previousTabRef = useRef<number | null>(null);
  const direction =
    previousTabRef.current !== null && resolvedSelectedTab !== null
      ? resolvedSelectedTab > previousTabRef.current
        ? 1
        : -1
      : 0;
  if (resolvedSelectedTab !== previousTabRef.current) {
    previousTabRef.current = resolvedSelectedTab;
  }

  const tabsId = useId();

  const contextValue: TabGroupContextValue = useMemo(
    () => ({
      selectedTab: resolvedSelectedTab,
      direction,
      tabsId,
      select: setSelectedTab,
    }),
    [resolvedSelectedTab, direction, tabsId, setSelectedTab],
  );

  return (
    <TabGroupContext.Provider value={contextValue}>
      {children}
    </TabGroupContext.Provider>
  );
};
