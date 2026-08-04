import React, {
  type KeyboardEvent,
  type ReactNode,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
} from 'react';
import {
  getNextTabIndex,
  type ReactProps,
  type TabsInterface,
  tabsStyle,
} from '@udixio/core';
import {
  createTabsIndicatorController,
  type TabsIndicatorController,
} from '@udixio/core/dom';

import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { Tab, type ReactTabProps, type TabSelectedEvent } from './Tab';
import { TabGroupContext } from './TabGroupContext';

export type { TabsVariant } from '@udixio/core';

export type ReactTabsProps = ReactProps<TabsInterface> & {
  children?: ReactNode;
  onSelectedTabChange?: (index: number | null) => void;
  onTabSelected?: (args: TabSelectedEvent) => void;
};

export const useTabsStyle = createUseStyle(tabsStyle);

/**
 * Tabs organize content across different screens and views
 * @status beta
 * @category Navigation
 * @devx
 * - Only `Tab` children are rendered; other children are ignored.
 * - Use `selectedTab`/`onSelectedTabChange` for controlled selection, or
 *   `defaultSelectedTab` (defaults to `0`) when uncontrolled.
 * - Wrapping in a `TabGroup` shares its selection automatically; do not also
 *   pass `selectedTab` directly to `Tabs` in that case, or the two owners
 *   fight over selection.
 * @a11y
 * - `role="tablist"` with a shared sliding indicator driven by a
 *   `@udixio/core/dom` Motion controller, the same one the Angular adapter
 *   uses.
 * - Roving `tabIndex`: ArrowLeft/ArrowRight move focus and selection between
 *   enabled tabs (wrapping), Home/End jump to the first/last enabled tab.
 * @limitations
 * - Horizontal orientation only.
 */
export const Tabs = ({
  variant = 'primary',
  onTabSelected,
  children,
  className,
  selectedTab: externalSelectedTab,
  defaultSelectedTab = 0,
  onSelectedTabChange,
  scrollable = false,
}: ReactTabsProps) => {
  const tabGroupContext = useContext(TabGroupContext);
  const hasPanels = tabGroupContext != null;

  const controlledValue =
    externalSelectedTab !== undefined
      ? externalSelectedTab
      : tabGroupContext?.selectedTab;

  const [selectedIndex, setSelectedIndex] = useControllableState({
    value: controlledValue,
    defaultValue: defaultSelectedTab,
    onChange: (next) => {
      if (tabGroupContext && externalSelectedTab === undefined) {
        tabGroupContext.select(next);
      } else {
        onSelectedTabChange?.(next);
      }
    },
    componentName: 'Tabs',
    stateName: 'selectedTab',
  });

  const tabChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab,
  ) as React.ReactElement<ReactTabProps>[];

  const disabledFlags = tabChildren.map((child) =>
    Boolean(child.props.disabled),
  );
  const firstEnabledIndex = disabledFlags.findIndex((isDisabled) => !isDisabled);
  const focusableIndex =
    selectedIndex != null && !disabledFlags[selectedIndex]
      ? selectedIndex
      : firstEnabledIndex;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const controllerRef = useRef<TabsIndicatorController | null>(null);

  const tabRefs = useRef<React.RefObject<HTMLButtonElement | null>[]>([])
    .current;
  if (tabRefs.length !== tabChildren.length) {
    tabRefs.length = 0;
    for (let i = 0; i < tabChildren.length; i++) {
      tabRefs[i] = React.createRef<HTMLButtonElement>();
    }
  }

  // The `primary` variant's indicator hugs the icon+label content (matching
  // the tab's own intrinsic width), while `secondary` spans the full tab;
  // this mirrors the original single-underline-per-tab implementation,
  // where `content` was only made a positioned ancestor for `primary`.
  const tabContentRefs = useRef<(HTMLSpanElement | null)[]>([]).current;
  if (tabContentRefs.length !== tabChildren.length) {
    tabContentRefs.length = tabChildren.length;
  }

  const handleOnTabSelected = (args: TabSelectedEvent) => {
    onTabSelected?.(args);

    if (scrollable) {
      const tabsEl = rootRef.current;
      const tabSelected: HTMLElement = args.ref.current;
      if (tabsEl && tabSelected) {
        const scrollLeft =
          tabSelected.offsetLeft +
          tabSelected.offsetWidth / 2 -
          tabsEl.offsetWidth / 2;
        tabsEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  };

  const generatedId = useId();
  const tabsId = tabGroupContext?.tabsId ?? generatedId;

  const selectTab = (index: number) => setSelectedIndex(index);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (
      key !== 'ArrowLeft' &&
      key !== 'ArrowRight' &&
      key !== 'Home' &&
      key !== 'End'
    ) {
      return;
    }
    if (!tabChildren.length || firstEnabledIndex === -1) return;
    event.preventDefault();

    const currentIndex = focusableIndex < 0 ? 0 : focusableIndex;
    const nextIndex = getNextTabIndex({
      key,
      currentIndex,
      disabled: disabledFlags,
    });
    setSelectedIndex(nextIndex);
    tabRefs[nextIndex]?.current?.focus();
  };

  // Read fresh from a ref, not closed over directly: the controller below is
  // created once (mount-only effect), so its `selectedTab` accessor must not
  // capture this render's `selectedIndex` value, or it would stay frozen at
  // whatever it was when the tab list first mounted.
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;
  const variantRef = useRef(variant);
  variantRef.current = variant;

  useLayoutEffect(() => {
    if (!rootRef.current || !indicatorRef.current) return;
    controllerRef.current = createTabsIndicatorController({
      root: rootRef.current,
      indicator: indicatorRef.current,
      selectedTab: () => {
        const index = selectedIndexRef.current;
        if (index == null) return null;
        return variantRef.current === 'primary'
          ? (tabContentRefs[index] ?? tabRefs[index]?.current ?? null)
          : (tabRefs[index]?.current ?? null);
      },
    });
    return () => controllerRef.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    controllerRef.current?.update();
  });

  const styles = useTabsStyle({
    variant,
    scrollable,
    selectedTab: externalSelectedTab,
    defaultSelectedTab,
    selectedIndex,
    className,
  });

  return (
    <div
      ref={rootRef}
      role="tablist"
      className={styles.tabs}
      onKeyDown={handleKeyDown}
    >
      {tabChildren.map((child, index) =>
        React.cloneElement(child, {
          key: index,
          ref: tabRefs[index],
          index,
          variant,
          selectedTab: selectedIndex,
          isFocusable: index === focusableIndex,
          hasPanels,
          tabsId,
          contentRef: (el: HTMLSpanElement | null) => {
            tabContentRefs[index] = el;
          },
          onTabSelect: selectTab,
          onTabSelected: handleOnTabSelected,
        }),
      )}
      <span ref={indicatorRef} className={styles.indicator} />
    </div>
  );
};
