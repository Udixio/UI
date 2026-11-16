import React, { useLayoutEffect, useRef, useState } from 'react';
import { animateStyle, type CurveTiming } from '@udixio/motion/animate';

/** The motion of a region that opens or closes: 250 ms on the standard curve. */
const COLLAPSE_TIMING: CurveTiming = {
  duration: 'duration.medium1',
  easing: 'easing.standard',
};

/** The motion of a chevron turning: 200 ms on the standard curve. */
const CHEVRON_TIMING: CurveTiming = {
  duration: 'duration.short4',
  easing: 'easing.standard',
};

/**
 * Keeps a region rendered while it opens and closes: it grows from zero height while it fades in, and shrinks back
 * while it fades out, and is removed once it has closed. `ref` goes on the region; `mounted` says whether to render it.
 */
function useCollapse<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T | null>(null);
  const [mounted, setMounted] = useState(open);
  // The state the region was last animated to, and whether this opening rendered it (so it starts from zero height).
  const drawn = useRef(open);
  const fresh = useRef(false);

  useLayoutEffect(() => {
    if (open && !mounted) {
      fresh.current = true;
      setMounted(true);
      return;
    }
    const element = ref.current;
    if (!element || drawn.current === open) return;
    drawn.current = open;
    if (open) {
      // Reopened while closing: the motion starts from the height the region has now, as the interrupted one did.
      const frames = fresh.current
        ? [
            { height: 0, opacity: 0 },
            { height: 'auto', opacity: 1 },
          ]
        : { height: 'auto', opacity: 1 };
      fresh.current = false;
      animateStyle(element, frames, { timing: COLLAPSE_TIMING });
    } else {
      animateStyle(element, { height: 0, opacity: 0 }, { timing: COLLAPSE_TIMING })
        .finished.then((outcome) => {
          if (outcome === 'finished') setMounted(false);
        });
    }
  }, [open, mounted]);

  return { ref, mounted };
}

/**
 * A region that opens from zero height and fades in, and closes the same way before it is removed. While it closes it
 * is `inert`, so its content cannot be reached as it goes.
 */
export const Collapsible = ({
  open,
  className,
  children,
}: {
  open: boolean;
  className?: string;
  children: React.ReactNode;
}) => {
  const { ref, mounted } = useCollapse<HTMLDivElement>(open);
  if (!mounted) return null;
  return (
    <div
      ref={ref}
      inert={!open}
      className={className ? `overflow-hidden ${className}` : 'overflow-hidden'}
    >
      {children}
    </div>
  );
};

/** A chevron that turns a half turn when `open` changes, and points down while closed. */
export const RotatingChevron = ({ open }: { open: boolean }) => {
  const ref = useRef<SVGSVGElement>(null);
  const [initiallyOpen] = useState(open);
  const drawn = useRef(open);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || drawn.current === open) return;
    drawn.current = open;
    animateStyle(element, { rotate: open ? '180deg' : '0deg' }, { timing: CHEVRON_TIMING });
  }, [open]);

  return (
    <svg
      ref={ref}
      className="mr-2 text-on-surface-variant shrink-0"
      style={{ rotate: initiallyOpen ? '180deg' : undefined }}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
};
