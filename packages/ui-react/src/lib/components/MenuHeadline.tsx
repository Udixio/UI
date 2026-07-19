import { type ReactNode } from 'react';
import {
  type MenuHeadlineInterface,
  menuHeadlineStyle,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';

export type ReactMenuHeadlineProps = ReactProps<MenuHeadlineInterface> & {
  children?: ReactNode;
};

export const useMenuHeadlineStyle = createUseStyle(menuHeadlineStyle);

export const MenuHeadline = ({
  label,
  children,
  variant,
  className,
  ...restProps
}: ReactMenuHeadlineProps) => {
  const styles = useMenuHeadlineStyle({ label, variant, className });
  return (
    <div
      className={styles.headline}
      role="group"
      aria-label={label}
      {...restProps}
    >
      {children ?? label}
    </div>
  );
};
