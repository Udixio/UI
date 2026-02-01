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
    children?: React.ReactNode;
  };
  states: { isClient: boolean };
  elements: ['stateLayer'];
}

export const State = ({
  style,
  colorName,
  stateClassName = 'state-ripple-group',
  children,
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
        : 'group/' + stateClassName.split('[')[1].split(']')[0];

      // On échappe le slash pour le sélecteur CSS
      const safeGroupName = groupName.replace(/\//g, '\\/');

      const furthestGroupState = ref.current.closest(
        `.${safeGroupName}:not(.${safeGroupName} .${safeGroupName})`,
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
        ['--state-color' as any]: `var(--default-color, var(--color-${colorName}))`,
        ...style,
      }}
    >
      {isClient && <RippleEffect triggerRef={groupStateRef} />}
      {children}
    </div>
  );
};
// ... existing code ...
const cardConfig: ClassNameComponent<StateInterface> = ({
  isClient,
  stateClassName,
}) => ({
  stateLayer: classNames([
    'w-full top-0 left-0 h-full absolute pointer-events-none overflow-hidden',
    stateClassName,
  ]),
});

export const useStateStyle = createUseClassNames<StateInterface>(
  'stateLayer',
  cardConfig,
);
