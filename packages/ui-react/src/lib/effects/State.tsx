import { RippleEffect } from './ripple';
import {
  ClassNameComponent,
  classNames,
  createUseClassNames,
  ReactProps,
} from '../utils';
import { useEffect, useRef, useState } from 'react';

export interface StateInterface {
  type: 'div';
  props: {
    colorName: string;
    stateClassName?:
      | string
      | 'state-ripple-group'
      | 'state-group'
      | 'state-layer';
    className?: string;
    style?: React.CSSProperties;
  };
  states: { isClient: boolean };
  elements: ['stateLayer'];
}

export const State = ({
  style,
  colorName,
  stateClassName = 'state-ripple-group',
  className,
}: ReactProps<StateInterface>) => {
  const ref = useRef<HTMLDivElement>(null);
  const groupStateRef = useRef<HTMLElement | null>(null);

  const [isClient, setIsClient] = useState(false);
  const styles = useStateStyle({
    isClient,
    stateClassName,
    className,
    colorName,
  });

  useEffect(() => {
    if (ref.current && stateClassName !== 'state-layer') {
      const groupName = !stateClassName.includes('[')
        ? 'group'
        : stateClassName.split('[')[1].split(']')[0];
      const furthestGroupState = ref.current.closest(
        `.${groupName}:not(.${groupName} .${groupName})`,
      );
      groupStateRef.current = furthestGroupState as HTMLElement | null;
    }
    setIsClient(true);
  }, []);

  return (
    <div
      ref={ref}
      className={styles.stateLayer}
      style={{
        ['--state-color' as any]: `var(--color-${colorName})`,
        ...style,
      }}
    >
      {isClient && <RippleEffect triggerRef={groupStateRef} />}
    </div>
  );
};
// ... existing code ...
const cardConfig: ClassNameComponent<StateInterface> = ({
  isClient,
  stateClassName,
}) => ({
  stateLayer: classNames([
    stateClassName,
    'w-full top-0 left-0 h-full absolute pointer-events-none overflow-hidden',
  ]),
});

export const useStateStyle = createUseClassNames<StateInterface>(
  'stateLayer',
  cardConfig,
);
