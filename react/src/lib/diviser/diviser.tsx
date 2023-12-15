import React, { FunctionComponent } from 'react';
import { StyleHelper } from '../utils/style.helper';

export interface DiviserProps {
  className?: string;
}

export const Diviser: FunctionComponent<DiviserProps> = ({ className }) => {
  const getDiviserClass = StyleHelper.classNames([
    className,
    'h-px w-full text-outline-variant',
  ]);

  return <hr className={getDiviserClass} />;
};
