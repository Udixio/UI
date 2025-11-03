import { useRef } from 'react';
import { CardInterface } from '../interfaces';
import { useCardStyle } from '../styles';
import { ReactProps } from '../utils';
import { State } from '../effects';

/**
 * Cards display content and actions about a single subject
 * @status beta
 * @category Layout
 */
export const Card = ({
  variant = 'outlined',
  className,
  children,
  isInteractive = false,
  ref,
  ...rest
}: ReactProps<CardInterface>) => {
  const styles = useCardStyle({ className, isInteractive, variant, children });

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef = ref || defaultRef;

  return (
    <div {...rest} ref={resolvedRef} className={styles.card}>
      {isInteractive && (
        <State
          className={styles.stateLayer}
          colorName={'on-surface'}
          stateClassName={'state-ripple-group-[card]'}
        />
      )}

      {children}
    </div>
  );
};
