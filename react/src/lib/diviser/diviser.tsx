import React, { FunctionComponent } from 'react';
import { StylingHelper } from '../utils';

export interface DiviserProps {
  className?: string;
}

export const Diviser: FunctionComponent<DiviserProps> = ({ className }) => {
  const getDiviserClass = StylingHelper.classNames([
    className,
    'h-px w-full text-outline-variant',
  ]);

  return <hr className={getDiviserClass} />;
};
