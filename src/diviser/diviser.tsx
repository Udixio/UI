import React, { FunctionComponent } from 'react';
import { StylesHelper } from '../utils';

export interface DiviserProps {
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

export const Diviser: FunctionComponent<DiviserProps> = ({
  className,
  orientation = 'horizontal',
}) => {
  const getDiviserClass = StylesHelper.classNames([
    className,
    'border-outline-variant ',
    {
      'h-fit w-full border-t': orientation === 'horizontal',
    },
    {
      'h-full w-fit border-l': orientation === 'vertical',
    },
  ]);

  return <hr className={getDiviserClass} />;
};
