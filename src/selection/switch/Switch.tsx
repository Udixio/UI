import React, { forwardRef, useRef, useState } from 'react';
import { StyleProps, StylesHelper } from '../../utils';
import { SwitchStyle } from './SwitchStyle';
import { Icon } from '../../icon';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { motion } from 'framer-motion';

export interface SwitchState {
  isSelected: boolean;
  activeIcon?: IconDefinition;
  inactiveIcon?: IconDefinition;
  disabled?: boolean;
}

export type SwitchElement =
  | 'switch'
  | 'handleContainer'
  | 'icon'
  | 'handleStateLayer'
  | 'handle';

export interface SwitchProps
  extends StyleProps<Omit<SwitchState, 'isSelected'>, SwitchElement>,
    Omit<SwitchState, 'isSelected'>,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'onChange'> {
  onChange?: (checked: boolean) => void;
  selected: boolean;
}

export const Switch = forwardRef<HTMLDivElement, SwitchProps>((args, ref) => {
  const {
    selected,
    className,
    activeIcon,
    disabled,
    inactiveIcon,
    onChange,
    ...restProps
  } = args;

  const [isSelected, setIsSelected] = useState(selected);

  const handleClick = (event: React.MouseEvent) => {
    if (disabled) return;
    setIsSelected(!isSelected);
    onChange?.(!isSelected);
    if (args.onClick) {
      // @ts-ignore
      args.onClick(event);
    }
  };

  const getClassNames = (() => {
    return StylesHelper.classNamesElements<SwitchState, SwitchElement>({
      default: 'switch',
      classNameList: [className, SwitchStyle],
      states: {
        isSelected,
        activeIcon,
        inactiveIcon,
        disabled,
      },
    });
  })();

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef: React.RefObject<any> | React.ForwardedRef<any> =
    ref || defaultRef;

  return (
    <motion.div
      onClick={handleClick}
      ref={resolvedRef}
      className={getClassNames.switch}
      {...restProps}
    >
      <motion.div
        layout
        style={{ translate: isSelected ? '50%' : '-50%' }}
        transition={{
          type: 'spring',
          stiffness: 700,
          damping: 30,
        }}
        className={getClassNames.handleContainer}
      >
        <div className={getClassNames.handle}>
          {(isSelected ? activeIcon : inactiveIcon) && (
            <Icon
              className={getClassNames.icon}
              icon={isSelected ? activeIcon : inactiveIcon}
            ></Icon>
          )}
        </div>
        <div className={getClassNames.handleStateLayer} />
      </motion.div>
    </motion.div>
  );
});
