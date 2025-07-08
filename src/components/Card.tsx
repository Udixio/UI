import { useRef } from 'react';

import { RippleEffect } from '../effects/ripple';
import { CardInterface } from '../interfaces/card.interface';
import { cardStyle } from '../styles/card.style';
import { ReactProps } from '../utils/component';

export const Card = ({
  variant = 'outlined',
  className,
  children,
  isInteractive = false,
  ref,
  ...rest
}: ReactProps<CardInterface>) => {
  const styles = cardStyle({ className, isInteractive, variant });

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef = ref || defaultRef;

  return (
    <div {...rest} ref={resolvedRef} className={styles.card}>
      <div className={styles.stateLayer}>
        {isInteractive && (
          <RippleEffect colorName={'on-surface'} triggerRef={resolvedRef} />
        )}
      </div>
      {children}
    </div>
  );
};
