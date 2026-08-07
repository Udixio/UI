import React, {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { AnchorPositionerProps as CoreAnchorPositionerProps } from '@udixio/core';
import {
  createAnchorPositionerController,
  type AnchorPositionerController,
} from '@udixio/core/dom';
import IntrinsicElements = React.JSX.IntrinsicElements;

export type { AnchorPosition } from '@udixio/core';

export type ReactAnchorPositionerProps = CoreAnchorPositionerProps & {
  /** The element the floating content is positioned relative to. */
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
};

/**
 * Floats `children` next to an anchor element using native CSS Anchor
 * Positioning where supported, falling back to a `position: fixed` element
 * tracked against the anchor's rect. The positioning math is implemented
 * once in `@udixio/core/dom` and shared with the Angular adapter.
 * @status beta
 * @category Communication
 * @devx
 * - Internal building block for `Tooltip`; not yet documented as a
 *   standalone public component.
 * - Portals `children` to `document.body`.
 * @a11y
 * - Renders no semantics of its own; the caller's content and `Tooltip`'s
 *   own `role="tooltip"` carry accessibility meaning.
 * @limitations
 * - Falls back to tracking `getBoundingClientRect()` on scroll and resize
 *   in browsers without native CSS Anchor Positioning support.
 */
export const AnchorPositioner = ({
  anchorRef,
  position = 'bottom',
  children,
  style,
  className,
  ...restProps
}: ReactAnchorPositionerProps &
  Omit<IntrinsicElements['div'], 'style' | 'className' | 'children'>) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [floating, setFloating] = useState<HTMLDivElement | null>(null);
  const controllerRef = useRef<AnchorPositionerController | null>(null);
  const positionRef = useRef(position);
  positionRef.current = position;

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || !floating) return undefined;

    const controller = createAnchorPositionerController({
      anchor,
      floating,
      position: () => positionRef.current,
    });
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [anchorRef, floating]);

  useEffect(() => {
    controllerRef.current?.update();
  }, [position]);

  if (!isMounted) return null;

  return createPortal(
    <div
      ref={setFloating}
      style={{ zIndex: 50, ...style }}
      className={className}
      {...restProps}
    >
      {children}
    </div>,
    document.body,
  );
};
