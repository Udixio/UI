import { RefObject, useLayoutEffect, useState } from 'react';

type Position =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

type Variant = 'plain' | 'rich';

export interface UseTooltipPositionOptions {
  targetRef: RefObject<HTMLElement | null>;
  position?: Position;
  variant?: Variant;
  isOpen: boolean;
}

export interface UseTooltipPositionReturn {
  resolvedPosition: Position;
}

/**
 * Hook to calculate tooltip position using useLayoutEffect.
 * Auto-flips position if not enough viewport space.
 *
 * For plain variant: prefers left/right, falls back to top/bottom
 * For rich variant: uses corner positions (top-left, top-right, bottom-left, bottom-right)
 */
export function useTooltipPosition({
  targetRef,
  position: positionProp,
  variant = 'plain',
  isOpen,
}: UseTooltipPositionOptions): UseTooltipPositionReturn {
  const [resolvedPosition, setResolvedPosition] = useState<Position>(
    positionProp ?? 'bottom',
  );

  useLayoutEffect(() => {
    // If position is explicitly set, use it
    if (positionProp) {
      setResolvedPosition(positionProp);
      return;
    }

    // Only calculate if open and we have a target
    if (!isOpen || !targetRef.current || typeof window === 'undefined') {
      return;
    }

    const targetElement = targetRef.current;
    const rect = targetElement.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Normalized position (0-1 range)
    const x = rect.left / viewportWidth;
    const y = rect.top / viewportHeight;

    let newPosition: Position;

    if (variant === 'plain') {
      // Plain variant: prefer horizontal positioning, fall back to vertical
      if (x < 1 / 3) {
        newPosition = 'right';
      } else if (x > 2 / 3) {
        newPosition = 'left';
      } else {
        newPosition = y > 0.5 ? 'top' : 'bottom';
      }
    } else {
      // Rich variant: use corner positions
      if (x < 0.5 && y < 0.5) {
        newPosition = 'bottom-right';
      } else if (x >= 0.5 && y < 0.5) {
        newPosition = 'bottom-left';
      } else if (x >= 0.5 && y >= 0.5) {
        newPosition = 'top-left';
      } else {
        newPosition = 'top-right';
      }
    }

    setResolvedPosition(newPosition);
  }, [isOpen, targetRef, positionProp, variant]);

  return {
    resolvedPosition,
  };
}
