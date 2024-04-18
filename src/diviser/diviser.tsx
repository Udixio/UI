import React, { FunctionComponent } from 'react';
import { StylesHelper } from '../utils';

export interface DiviserProps {
  className?: string;
}

export const Diviser: FunctionComponent<DiviserProps> = ({ className }) => {
  const getDiviserClass = StylesHelper.classNames([
    className,
    'h-px w-full text-outline-variant',
  ]);

  return <hr className={getDiviserClass} />;
};
