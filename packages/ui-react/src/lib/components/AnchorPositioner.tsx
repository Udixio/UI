import React, {
  CSSProperties,
  RefObject,
  useId,
  useLayoutEffect,
  useState,
} from 'react';
import { SyncedFixedWrapper } from '../effects';
import { createPortal } from 'react-dom';

export type Position =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface AnchorPositionerProps {
  anchorRef: RefObject<HTMLElement | null>;
  position?: Position;
  children: React.ReactNode;
  style?: CSSProperties;
  className?: string; // Optional if we want to wrap in a class
}

export const AnchorPositioner = ({
  anchorRef,
  position = 'bottom',
  children,
  style,
}: AnchorPositionerProps) => {
  const uniqueId = useId();
  const anchorName = `--anchor-${uniqueId.replace(/:/g, '')}`;
  const [supportsAnchor, setSupportsAnchor] = useState(false);

  useLayoutEffect(() => {
    if (typeof CSS !== 'undefined' && CSS.supports('anchor-name', '--a')) {
      setSupportsAnchor(true);
    }
  }, []);

  useLayoutEffect(() => {
    if (supportsAnchor && anchorRef.current) {
      const el = anchorRef.current;
      // Apply anchor name to the reference element
      (el.style as any).anchorName = anchorName;
      return () => {
        if (anchorRef.current) {
          (anchorRef.current.style as any).anchorName = '';
        }
      };
    }
  }, [supportsAnchor, anchorRef, anchorName]);

  if (supportsAnchor) {
    const positionAreaMap: Record<Position, string> = {
      top: 'top',
      bottom: 'bottom',
      left: 'left',
      right: 'right',
      'top-left': 'top left',
      'top-right': 'top right',
      'bottom-left': 'bottom left',
      'bottom-right': 'bottom right',
    };

    const floatingStyles: CSSProperties = {
      position: 'fixed',
      margin: 0,
      zIndex: 9999,
      positionAnchor: anchorName,
      positionArea: positionAreaMap[position],
      positionTryFallbacks: 'flip-block, flip-inline',
      ...style,
    } as any;

    return createPortal(
      <div style={floatingStyles}>{children}</div>,
      document.body,
    );
  }

  const fallbackStyles: CSSProperties = {
    position: 'absolute',
    pointerEvents: 'auto',
    ...style,
  };

  switch (position) {
    case 'top':
      fallbackStyles.bottom = '100%';
      fallbackStyles.left = '50%';
      fallbackStyles.transform = 'translateX(-50%)';
      break;
    case 'top-left':
      fallbackStyles.bottom = '100%';
      fallbackStyles.left = 0;
      break;
    case 'top-right':
      fallbackStyles.bottom = '100%';
      fallbackStyles.right = 0;
      break;
    case 'bottom':
      fallbackStyles.top = '100%';
      fallbackStyles.left = '50%';
      fallbackStyles.transform = 'translateX(-50%)';
      break;
    case 'bottom-left':
      fallbackStyles.top = '100%';
      fallbackStyles.left = 0;
      break;
    case 'bottom-right':
      fallbackStyles.top = '100%';
      fallbackStyles.right = 0;
      break;
    case 'left':
      fallbackStyles.right = '100%';
      fallbackStyles.top = '50%';
      fallbackStyles.transform = 'translateY(-50%)';
      break;
    case 'right':
      fallbackStyles.left = '100%';
      fallbackStyles.top = '50%';
      fallbackStyles.transform = 'translateY(-50%)';
      break;
  }

  return (
    <SyncedFixedWrapper targetRef={anchorRef}>
      <div style={fallbackStyles}>{children}</div>
    </SyncedFixedWrapper>
  );
};
