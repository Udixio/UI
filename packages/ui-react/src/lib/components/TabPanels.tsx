import React, { type ReactNode, useContext } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TabGroupContext } from './TabGroupContext';
import {
  type ReactProps,
  type TabPanelsInterface,
  tabPanelsStyle,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { TabPanel } from './TabPanel';

export type ReactTabPanelsProps = ReactProps<TabPanelsInterface> & {
  children?: ReactNode;
};

export const useTabPanelsStyle = createUseStyle(tabPanelsStyle);

/**
 * TabPanels renders the content panels with slide animation
 * Must be used within a TabGroup
 * @status beta
 * @parent Tabs
 * @category Navigation
 * @devx
 * - Requires `TabGroup` context; otherwise it renders nothing.
 * @limitations
 * - Only renders the active panel (no offscreen preservation).
 */
export const TabPanels = ({ children, className }: ReactTabPanelsProps) => {
  const context = useContext(TabGroupContext);

  if (!context) {
    console.warn('TabPanels must be used within a TabGroup');
    return null;
  }

  const { selectedTab, direction, tabsId } = context;

  const panelChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === TabPanel,
  ) as React.ReactElement<{ isSelected?: boolean }>[];

  const styles = useTabPanelsStyle({
    className,
  });

  return (
    <div className={styles.tabPanels}>
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        {panelChildren.map(
          (child, index) =>
            selectedTab === index && (
              <motion.div
                key={index}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({
                    x: dir * 100 + '%',
                    opacity: 1,
                  }),
                  center: { x: 0, opacity: 1 },
                  exit: (dir: number) => ({
                    x: dir * -100 + '%',
                    opacity: 1,
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                role="tabpanel"
                aria-labelledby={`tab-${tabsId}-${index}`}
              >
                {React.cloneElement(child, { isSelected: true })}
              </motion.div>
            ),
        )}
      </AnimatePresence>
    </div>
  );
};
