import React, { useRef } from 'react';

import { RippleEffect } from '../../../effects/ripple';
import { CardProps } from './card.interface';
import { cardStyle } from './card.style';

export const Card = ({
  variant = 'outlined',
  className,
  children,
  isInteractive = false,
  ref,
  ...rest
}: CardProps) => {
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
