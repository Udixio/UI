import { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Transition } from 'motion';
import { ReactProps } from '../utils';
import { NavigationRailItemInterface } from './navigation-rail-item.interface';

type MenuState = {
  icon: IconDefinition;
  label: string;
};

export interface NavigationRailInterface {
  type: 'div';
  props: {
    variant?: 'standard' | 'modal';
    onItemSelected?: (
      args: { index: number } & Pick<
        ReactProps<NavigationRailItemInterface>,
        'label' | 'icon'
      > & {
          ref: RefObject<any>;
        }
    ) => void;
    children: ReactNode;
    selectedItem?: number | null;
    setSelectedItem?: Dispatch<SetStateAction<number | null>>;
    extended?: boolean;
    alignment?: 'middle' | 'top';
    menu?: {
      closed: MenuState;
      opened: MenuState;
    };
    onExtendedChange?: (extended: boolean) => void;

    transition?: Transition;
  };
  states: { isExtended?: boolean };
  elements: ['navigationRail', 'header', 'menuIcon', 'segments'];
}
