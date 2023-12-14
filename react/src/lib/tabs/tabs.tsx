import React, { FunctionComponent, useState } from 'react';
import { Tab, TabProps } from './tab';
import { StylingHelper } from '../utils';
import { Diviser } from '../diviser';

export enum TabsVariant {
  Primary = 'primary',
  Secondary = 'secondary',
}

export interface TabsProps {
  variant?: TabsVariant;
  tabs: Omit<TabProps, 'selected'>[];
  onTabSelected?: (index: number) => void;
}

export const Tabs: FunctionComponent<TabsProps> = ({
  tabs,
  variant = TabsVariant.Primary,
  onTabSelected,
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const [underlineOffset, setUnderlineOffset] = useState(0);
  const handleChange = (index: number) => (event: React.MouseEvent) => {
    setSelectedTab(index);
    if (onTabSelected) {
      onTabSelected(index); // Call the callback
    }
  };

  const getTabClass = StylingHelper.classNames([
    'flex-1',
    {
      applyWhen: variant === TabsVariant.Primary,
      styles: [],
    },
    {
      applyWhen: variant === TabsVariant.Secondary,
      styles: [],
    },
  ]);

  const getUnderlineClass = StylingHelper.classNames([
    'bg-primary  absolute  bottom-0 transition-all duration-300',
    {
      applyWhen: variant === TabsVariant.Primary,
      styles: ['h-[3px] rounded-t'],
    },
    {
      applyWhen: variant === TabsVariant.Secondary,
      styles: ['h-0.5'],
    },
  ]);
  return (
    <div className="">
      <div className="flex relative">
        {tabs.map((tab, index) => {
          const isSelected = index === selectedTab;
          return (
            <Tab
              variant={variant}
              onClick={handleChange(index)}
              className={getTabClass}
              selected={isSelected}
              setUnderlineWidth={({ width, left }) => {
                setUnderlineWidth(width);
                setUnderlineOffset(left);
              }}
              {...tab}
            ></Tab>
          );
        })}
        <span
          style={{ width: underlineWidth + 'px', left: underlineOffset + 'px' }}
          className={getUnderlineClass}
        ></span>
      </div>
      <Diviser className="text-surface-container-highest " />
    </div>
  );
};
