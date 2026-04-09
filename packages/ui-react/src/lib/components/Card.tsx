import { useRef } from 'react';
import { CardInterface } from '../interfaces';
import { useCardStyle } from '../styles';
import { ReactProps } from '../utils';
import { State } from '../effects';

/**
 * Cards display content and actions about a single subject
 * @status beta
 * @category Layout
 * @devx
 * - `interactive` only adds a state layer; add your own click/role semantics.
 * @limitations
 * - No built-in header/actions slots; layout is fully custom via children.
 */
export const Card = ({
  variant = 'outlined',
  className,
  children,
  interactive = false,
  ref,
  ...rest
}: ReactProps<CardInterface>) => {
  const styles = useCardStyle({
    className,
    interactive,
    variant,
    children,
  });

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef = ref || defaultRef;

  return (
    <div {...rest} ref={resolvedRef} className={styles.card}>
      {interactive && (
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
