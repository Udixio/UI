import React, {
  FunctionComponent,
  ReactElement,
  useEffect,
  useState,
} from 'react';
import { TabProps } from './Tab';
import { StylesHelper } from '../../utils';
import { Diviser } from '../../diviser';

export type TabsVariant = 'primary' | 'secondary';

export interface TabsProps {
  variant?: TabsVariant;
  onTabSelected?: (
    args: { index: number } & Pick<TabProps, 'label' | 'icon'>
  ) => void;
  children: ReactElement<TabProps>[];
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

export const Tabs: FunctionComponent<TabsProps> = ({
  variant = 'primary',
  onTabSelected,
  children,
}) => {
  const [childRefs, setChildRefs] = React.useState([]);
  const [selectedTab, setSelectedTab] =
    useState<React.ForwardRefExoticComponent<
      HTMLButtonElement | HTMLAnchorElement
    > | null>(null);
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

  const getUnderlineClass = StylesHelper.classNames([
    'underline bg-primary  absolute  bottom-0 transition-all duration-300',
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
      Array(children.length)
        .fill(0)
        .map((_, i) => refs[i] || React.createRef())
    );
  }, [children]);

  useEffect(() => {
    if (selectedTab) {
      const index = childRefs.findIndex((ref: any) => ref === selectedTab);
      if (index !== -1 && onTabSelected) {
        const selectedChild = children[index];
        const label = selectedChild.props.label;
        onTabSelected({ index, label });
      }
    }
  }, [selectedTab]);

  return (
    <div className="">
      <div className="flex relative">
        <TabContext.Provider
          value={{
            // @ts-ignore
            setSelectedTab,
            selectedTab,
          }}
        >
          {children.map((child, index) => {
            return React.cloneElement(child, {
              key: index,
              // @ts-ignore
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
