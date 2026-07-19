import {
  type DividerInterface,
  dividerStyle,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';

export type ReactDividerProps = ReactProps<DividerInterface>;

export const useDividerStyle = createUseStyle(dividerStyle);

/**
 * Dividers are thin lines that group content in lists or other containers
 * @status beta
 * @category Layout
 * @devx
 * - Renders a semantic `<hr>`; use `orientation` for vertical dividers.
 */
export const Divider = ({
  orientation = 'horizontal',
  className,
  ...restProps
}: ReactDividerProps) => {
  const styles = useDividerStyle({ orientation, className });

  return <hr className={styles.divider} {...restProps} />;
};
