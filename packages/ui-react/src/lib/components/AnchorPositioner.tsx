import React, {
  CSSProperties,
  RefObject,
  useId,
  useLayoutEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { SyncedFixedWrapper } from '../effects';
import IntrinsicElements = React.JSX.IntrinsicElements;

export type PositionKeyword =
  | 'left'
  | 'center'
  | 'right'
  | 'span-left'
  | 'span-right'
  | 'x-start'
  | 'x-end'
  | 'span-x-start'
  | 'span-x-end'
  | 'self-x-start'
  | 'self-x-end'
  | 'span-self-x-start'
  | 'span-self-x-end'
  | 'top'
  | 'bottom'
  | 'span-top'
  | 'span-bottom'
  | 'y-start'
  | 'y-end'
  | 'span-y-start'
  | 'span-y-end'
  | 'self-y-start'
  | 'self-y-end'
  | 'span-self-y-start'
  | 'span-self-y-end'
  | 'block-start'
  | 'block-end'
  | 'span-block-start'
  | 'span-block-end'
  | 'inline-start'
  | 'inline-end'
  | 'span-inline-start'
  | 'span-inline-end'
  | 'self-block-start'
  | 'self-block-end'
  | 'span-self-block-start'
  | 'span-self-block-end'
  | 'self-inline-start'
  | 'self-inline-end'
  | 'span-self-inline-start'
  | 'span-self-inline-end'
  | 'start'
  | 'end'
  | 'span-start'
  | 'span-end'
  | 'self-start'
  | 'self-end'
  | 'span-self-start'
  | 'span-self-end'
  | 'span-all';

export type Position =
  | PositionKeyword
  | `${PositionKeyword} ${PositionKeyword}`
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'right-start'
  | 'right-end'
  | 'left-start'
  | 'left-end';

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
  ...restProps
}: AnchorPositionerProps & IntrinsicElements['div']) => {
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
    const floatingStyles: CSSProperties = {
      position: 'fixed',
      margin: 0,
      zIndex: 9999,
      positionAnchor: anchorName,
      positionArea: position,
      positionTryFallbacks: 'flip-block, flip-inline', // Correct CSS prop
      ...style,
    } as any;

    return createPortal(
      <div style={floatingStyles} {...restProps}>
        {children}
      </div>,
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
      <div style={fallbackStyles} {...restProps}>
        {children}
      </div>
    </SyncedFixedWrapper>
  );
};
