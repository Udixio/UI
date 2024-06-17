import React, { ReactNode, useEffect, useState } from 'react';
import { Tab, TabProps } from './Tab';
import { StylesHelper } from '../../utils';
import classnames from 'classnames';
import { motion } from 'framer-motion';

export type TabsVariant = 'primary' | 'secondary';

export interface TabsProps {
  variant?: TabsVariant;
  onTabSelected?: (
    args: { index: number } & Pick<TabProps, 'label' | 'icon'>
  ) => void;
  children: ReactNode;
  stateVariant?: 'fit' | 'full';
  className?: string;
}

interface TabContextType {
  setSelectedTab:
    | ((ref: React.ForwardedRef<HTMLButtonElement | HTMLAnchorElement>) => void)
    | null;
  selectedTab: React.ForwardRefExoticComponent<
    HTMLButtonElement | HTMLAnchorElement
  > | null;
}

export const TabContext = React.createContext<TabContextType>({
  setSelectedTab: null,
  selectedTab: null,
});

export const Tabs = ({
  variant = 'primary',
  onTabSelected,
  children,
  className,
  stateVariant,
}: TabsProps) => {
  const [childRefs, setChildRefs] = React.useState([]);
  const [selectedTab, setSelectedTab] =
    useState<React.ForwardRefExoticComponent<
      HTMLButtonElement | HTMLAnchorElement
    > | null>(null);
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const [underlineOffset, setUnderlineOffset] = useState(0);
  const tabChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab
  );

  const resizeUnderline = () => {
    if (selectedTab) {
      let element = (selectedTab as any).current as HTMLElement;
      let width: number;
      let left: number;
      if (variant == 'primary') {
        const child: HTMLElement = element.querySelector(' .content')!;
        const style = window.getComputedStyle(child);
        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingRight = parseFloat(style.paddingRight);
        width = child.clientWidth - paddingLeft - paddingRight;
        left = element.offsetLeft + child.offsetLeft;
      } else {
        width = element.clientWidth;
        left = element.offsetLeft;
      }

      setUnderlineWidth(width);
      setUnderlineOffset(left);
    }
  };

  useEffect(() => {
    resizeUnderline();
    window.addEventListener('resize', resizeUnderline);
    return () => {
      window.removeEventListener('resize', resizeUnderline);
    };
  }, [selectedTab, variant]);

  const getUnderlineClass = StylesHelper.classNames([
    'underline bg-primary  absolute  bottom-0',
    {
      applyWhen: variant === 'primary',
      styles: ['h-[3px] rounded-t'],
    },
    {
      applyWhen: variant === 'secondary',
      styles: ['h-0.5'],
    },
  ]);

  React.useEffect(() => {
    setChildRefs((refs) =>
      Array(tabChildren.length)
        .fill(0)
        .map((_, i) => refs[i] || React.createRef())
    );
  }, [children]);

  useEffect(() => {
    if (selectedTab) {
      const index = childRefs.findIndex((ref: any) => ref === selectedTab);
      if (index !== -1 && onTabSelected) {
        const selectedChild = tabChildren[
          index
        ] as React.ReactElement<TabProps>;
        const label = selectedChild.props.label;
        onTabSelected({ index, label });
      }
    }
  }, [selectedTab]);

  return (
    <div
      className={classnames(
        className,
        'border-b border-surface-container-highest',
        'flex relative'
      )}
    >
      <TabContext.Provider
        value={{
          // @ts-ignore
          setSelectedTab,
          selectedTab,
        }}
      >
        {tabChildren.map((child, index) => {
          return React.cloneElement(child as React.ReactElement, {
            key: index,
            ref: childRefs[index],
            variant: variant,
            stateVariant: stateVariant,
          });
        })}
      </TabContext.Provider>
      <motion.span
        initial={false}
        animate={{ width: underlineWidth, left: underlineOffset }}
        transition={{
          type: 'tween',
          duration: 0.3,
          ease: 'easeOut',
        }}
        className={getUnderlineClass}
      ></motion.span>
    </div>
  );
};