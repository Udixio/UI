import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

type SyncedFixedWrapperProps = {
  targetRef: RefObject<any>;
  children: ReactNode;
};

export const SyncedFixedWrapper = ({
  targetRef,
  children,
}: SyncedFixedWrapperProps) => {
  const [style, setStyle] = useState<React.CSSProperties | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  const updatePosition = () => {
    const target = targetRef.current;
    if (!target) return;

    const rect = target.getBoundingClientRect();

    setStyle({
      position: 'fixed',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      pointerEvents: 'none', // si le wrapper ne doit pas capter les events
      zIndex: 999, // personnalise si besoin
    });
  };

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    // Observe resize of the target element
    resizeObserver.current = new ResizeObserver(updatePosition);
    resizeObserver.current.observe(target);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      resizeObserver.current?.disconnect();
    };
  }, [targetRef]);

  if (!style) return null;

  return createPortal(<div style={style}>{children}</div>, document.body);
};
