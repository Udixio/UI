import React, {
  CSSProperties,
  RefObject,
  useId,
  useLayoutEffect,
  useState,
} from 'react';
import { SyncedFixedWrapper } from '../effects';

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

    return <div style={floatingStyles}>{children}</div>;
  }

  return (
    <SyncedFixedWrapper targetRef={anchorRef}>{children}</SyncedFixedWrapper>
  );
};
