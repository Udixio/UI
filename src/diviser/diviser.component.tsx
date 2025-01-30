import React from 'react';
import { diviserStyle } from './diviser.style';
import { DiviserProps } from './diviser.interface';

export const Diviser = ({
  orientation = 'horizontal',
  className,
  ...restProps
}: DiviserProps) => {
  const styles = diviserStyle({ orientation, className });

  return <hr className={styles.diviser} {...restProps} />;
};
