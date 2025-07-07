import React from 'react';
import { dividerStyle } from '../styles/divider.style';
import { DividerProps } from '../interfaces/divider.interface';

export const Divider = ({
  orientation = 'horizontal',
  className,
  ...restProps
}: DividerProps) => {
  const styles = dividerStyle({ orientation, className });

  return <hr className={styles.divider} {...restProps} />;
};
