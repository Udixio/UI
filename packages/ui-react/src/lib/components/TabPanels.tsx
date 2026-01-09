import React, { useContext } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TabGroupContext } from './TabGroupContext';
import { TabPanelsInterface, TabPanelInterface } from '../interfaces/tab-panels.interface';
import { ReactProps } from '../utils/component';
import { useTabPanelsStyle, useTabPanelStyle } from '../styles/tab-panels.style';
import { TabPanel } from './TabPanel';

/**
 * TabPanels renders the content panels with slide animation
 * Must be used within a TabGroup
 * @status beta
 * @category Navigation
 */
export const TabPanels = ({
  children,
  className,
}: ReactProps<TabPanelsInterface>) => {
  const context = useContext(TabGroupContext);

  if (!context) {
    console.warn('TabPanels must be used within a TabGroup');
    return null;
  }

  const { selectedTab, direction, tabsId } = context;

  const panelChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === TabPanel,
  ) as React.ReactElement[];

  const styles = useTabPanelsStyle({
    children,
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
                    opacity: 0,
                  }),
                  center: { x: 0, opacity: 1 },
                  exit: (dir: number) => ({
                    x: dir * -100 + '%',
                    opacity: 0,
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
