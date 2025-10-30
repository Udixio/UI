import { RippleEffect } from './ripple';
import { ClassNameComponent, classNames, createUseClassNames } from '../utils';
import { useEffect, useRef, useState } from 'react';

export interface StateInterface {
  type: 'div';
  states: { isClient: boolean };
  elements: ['stateLayer'];
}

export const State = () => {
  const ref = useRef<HTMLDivElement>(null);
  const groupStateRef = useRef<HTMLElement | null>(null);

  const [isClient, setIsClient] = useState(false);
  const styles = useStateStyle({ isClient });

  useEffect(() => {
    if (ref.current) {
      const furthestGroupState = ref.current.closest(
        '.group:not(.group .group)',
      );
      groupStateRef.current = furthestGroupState as HTMLElement | null;
    }
    setIsClient(true);
  }, []);

  return (
    <div ref={ref} className={styles.stateLayer}>
      {isClient && (
        <RippleEffect colorName={'on-surface'} triggerRef={groupStateRef} />
      )}
    </div>
  );
};
// ... existing code ...
const cardConfig: ClassNameComponent<StateInterface> = ({ isClient }) => ({
  stateLayer: classNames([
    'w-full top-0 left-0 h-full absolute -z-10 pointer-events-none group-hover:hover-state-on-surface group-focus-visible:focus-state-on-surface',
    {
      'group-active:active-state-on-surface': !isClient,
    },
  ]),
});

export const useStateStyle = createUseClassNames<StateInterface>(
  'stateLayer',
  cardConfig,
);
