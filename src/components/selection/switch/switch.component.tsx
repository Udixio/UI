import React, { useRef, useState } from 'react';

import { Icon } from '../../../icon';
import { motion } from 'framer-motion';
import { SwitchProps } from '@components/selection/switch/switch.interface';
import { switchStyle } from '@components/selection/switch/switch.style';

export const SwitchComponent = ({
  selected = false,
  className,
  activeIcon = null,
  disabled = false,
  inactiveIcon = null,
  onChange = null,
  onClick,
  onKeyDown,
  ref,
  ...restProps
}: SwitchProps) => {
  const [isSelected, setIsSelected] = useState(selected);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    toggleSwitchState();
    if (onClick) {
      onClick(event);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggleSwitchState();
    }
    if (onKeyDown) {
      onKeyDown(event);
    }
  };

  const toggleSwitchState = () => {
    setIsSelected(!isSelected);
    onChange?.(!isSelected);
  };
  const styles = switchStyle({
    className,
    isSelected,
    activeIcon,
    inactiveIcon,
    disabled,
    selected: isSelected,
    onChange,
  });

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef: React.RefObject<any> | React.ForwardedRef<any> =
    ref || defaultRef;

  return (
    <motion.div
      role="switch"
      aria-checked={isSelected}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      ref={resolvedRef}
      className={styles.switch}
      {...restProps}
    >
      <input type="hidden" value={isSelected ? '1' : '0'} />
      <motion.div
        layout
        style={{ translate: isSelected ? '50%' : '-50%' }}
        transition={{
          type: 'spring',
          stiffness: 700,
          damping: 30,
        }}
        className={styles.handleContainer}
      >
        <div className={styles.handle}>
          {(isSelected ? activeIcon : inactiveIcon) && (
            <Icon
              className={styles.icon}
              icon={isSelected ? activeIcon! : inactiveIcon!}
            ></Icon>
          )}
        </div>
        <div className={styles.handleStateLayer} />
      </motion.div>
    </motion.div>
  );
};
