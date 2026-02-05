import React from 'react';
import { ReactProps } from '../utils/component';
import { MenuItem } from './MenuItem';

/**
 * MenuGroup renders a group of menu items with persistent styling.
 * It is primarily used to apply grouping logic or context to its children.
 *
 * @status beta
 * @category Selection
 */
export const MenuGroup = ({ 
  children, 
  className,
  ...restProps 
}: ReactProps<{ children: React.ReactNode }> & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={className} role="group" {...restProps}>
        {children}
    </div>
  );
};
