import React, {
  FunctionComponent,
  ReactElement,
  useEffect,
  useState,
} from 'react';
import { TabProps } from './tab';
import { StylingHelper } from '../../utils';
import { Diviser } from '../../diviser';

export enum TabsVariant {
  Primary = 'primary',
  Secondary = 'secondary',
}

export interface TabsProps {
  variant?: TabsVariant;
  onTabSelected?: (index: number) => void;
  children: ReactElement<TabProps>[];
}

interface TabContextType {
  setSelectedTab: ((ref: React.ForwardRefExoticComponent<any>) => void) | null;
  selectedTab: React.ForwardRefExoticComponent<any> | null;
}

export const TabContext = React.createContext<TabContextType>({
  setSelectedTab: null,
  selectedTab: null,
});

export const Tabs: FunctionComponent<TabsProps> = ({
  variant = TabsVariant.Primary,
  onTabSelected,
  children,
}) => {
  const [childRefs, setChildRefs] = React.useState([]);
  const [selectedTab, setSelectedTab] =
    useState<React.ForwardRefExoticComponent<any> | null>(null);
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const [underlineOffset, setUnderlineOffset] = useState(0);

  const resizeUnderline = () => {
    if (selectedTab) {
      let element = (selectedTab as any).current as HTMLElement;
      if (variant == 'primary') {
        element = element.querySelector('.content')!;
      }
      const style = window.getComputedStyle(element);
      const paddingLeft = parseFloat(style.paddingLeft);
      const paddingRight = parseFloat(style.paddingRight);
      const width = element.clientWidth - paddingLeft - paddingRight;
      const left = element.offsetLeft;
      setUnderlineWidth(width);
      setUnderlineOffset(left);
    }
  };

  useEffect(() => {
    resizeUnderline();
    window.addEventListener('resize', resizeUnderline);
  }, [selectedTab, variant]);

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

  React.useEffect(() => {
    setChildRefs((refs) =>
      Array(children.length)
        .fill(0)
        .map((_, i) => refs[i] || React.createRef())
    );
  }, [children]);

  return (
    <div className="">
      <div className="flex relative">
        <TabContext.Provider value={{ setSelectedTab, selectedTab }}>
          {children.map((child, index) => {
            return React.cloneElement(child, {
              key: index,
              ref: childRefs[index],
            });
          })}
        </TabContext.Provider>
        <span
          style={{ width: underlineWidth + 'px', left: underlineOffset + 'px' }}
          className={getUnderlineClass}
        ></span>
      </div>
      <Diviser className="text-surface-container-highest " />
    </div>
  );
};
