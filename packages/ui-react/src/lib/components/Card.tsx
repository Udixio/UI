import { useRef, type ReactNode } from 'react';
import {
  cardStyle,
  type CardInterface,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { State } from '../effects';

export type ReactCardProps = ReactProps<CardInterface> & {
  children?: ReactNode;
};

export const useCardStyle = createUseStyle(cardStyle);

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
}: ReactCardProps) => {
  const styles = useCardStyle({
    variant,
    interactive,
    className,
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
