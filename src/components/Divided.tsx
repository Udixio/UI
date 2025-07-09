import React from 'react';
import { dividerStyle } from '../styles/divider.style';
import { DividerInterface } from '../interfaces/divider.interface';
import { ReactProps } from '../utils';

export const Divider = ({
  orientation = 'horizontal',
  className,
  ...restProps
}: ReactProps<DividerInterface>) => {
  const styles = dividerStyle({ orientation, className });

  return <hr className={styles.divider} {...restProps} />;
};
