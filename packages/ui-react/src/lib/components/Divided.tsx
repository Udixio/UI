import { dividerStyle } from '../styles';
import { DividerInterface } from '../interfaces';
import { ReactProps } from '../utils';

export const Divider = ({
  orientation = 'horizontal',
  className,
  ...restProps
}: ReactProps<DividerInterface>) => {
  const styles = dividerStyle({ orientation, className });

  return <hr className={styles.divider} {...restProps} />;
};
