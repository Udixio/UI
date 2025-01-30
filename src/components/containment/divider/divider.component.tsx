import React from 'react';
import { dividerStyle } from './divider.style';
import { DividerProps } from './divider.interface';

export const Divider = ({
  orientation = 'horizontal',
  className,
  ...restProps
}: DividerProps) => {
  const styles = dividerStyle({ orientation, className });

  return <hr className={styles.divider} {...restProps} />;
};
