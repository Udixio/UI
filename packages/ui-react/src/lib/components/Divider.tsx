import { useDividerStyle } from '../styles';
import { DividerInterface } from '../interfaces';
import { ReactProps } from '../utils';

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
}: ReactProps<DividerInterface>) => {
  const styles = useDividerStyle({ orientation, className });

  return <hr className={styles.divider} {...restProps} />;
};
