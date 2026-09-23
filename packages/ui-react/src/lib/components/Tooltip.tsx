import {
  cloneElement,
  isValidElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  type AnchorPositionAxis,
  type ReactProps,
  type TooltipInterface,
  tooltipStyle,
} from '@udixio/core';
import {
  createTooltipTransitionController,
  type TooltipTransitionController,
} from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';
import { Button, type ReactButtonProps } from './Button';
import { AnchorPositioner } from './AnchorPositioner';
import { useTooltipTrigger } from '../hooks';

export type {
  TooltipPosition,
  TooltipTrigger,
  TooltipTransition,
  TooltipVariant,
} from '@udixio/core';

// `content` is omitted from the DOM attributes on purpose: React types the
// global microdata `content` attribute as `string`, which would intersect with
// the slot below and leave `string & ReactNode`.
export type ReactTooltipProps<T extends HTMLElement = HTMLElement> = Omit<
  ReactProps<TooltipInterface>,
  'content'
> & {
  /** Custom content slot that replaces title/text/buttons when provided */
  content?: ReactNode;
  buttons?: ReactButtonProps | ReactButtonProps[];
  /** Custom anchor for positioning. Defaults to the trigger element. */
  anchorRef?: RefObject<HTMLElement | null>;
  /** Notifies an accepted open-state request. */
  onOpenChange?: (open: boolean) => void;
} & (
    | {
        children?: never;
        targetRef: RefObject<T | null>;
      }
    | {
        children: ReactNode;
        targetRef?: never;
      }
  );

export const useTooltipStyle = createUseStyle(tooltipStyle);

/**
 * Tooltips display brief labels or messages
 * @status beta
 * @category Communication
 * @devx
 * - `content` overrides `title`/`text`/`buttons` for fully custom content.
 * - Supports controlled `open` plus `openDelay`/`closeDelay`.
 * - A touch long press opens after 500ms and remains visible for 1.5s after
 *   release, following Material 3 guidance.
 * - Opening one tooltip closes the currently visible tooltip in the document.
 * - The open/close opacity/height transition is implemented once with
 *   Anime.js in `@udixio/core/dom`, so React and Angular share the same
 *   timing, reduced-motion behavior, and cleanup. No `motion/react` is used.
 * - The tooltip surface stays mounted at all times (hidden via `inert` and
 *   `aria-hidden`) rather than mounting only while open, so it can animate
 *   out; expensive `content` subtrees are not torn down until the `Tooltip`
 *   itself unmounts.
 * @a11y
 * - Provides `role="tooltip"` and `aria-describedby` when open.
 * @limitations
 * - `children` stay mounted while closed, since the surface is always present
 *   for its open/close animation; expensive content is not torn down until
 *   the `Tooltip` itself unmounts.
 * - `position` falls back to tracking `getBoundingClientRect()` on scroll and
 *   resize in browsers without native CSS Anchor Positioning support.
 */
export const Tooltip = ({
  variant = 'plain',
  buttons,
  className,
  children,
  title,
  text,
  content,
  position: positionProp,
  autoAxis: autoAxisProp,
  targetRef,
  ref,
  trigger = ['hover', 'focus'],
  describeTarget = true,
  transition,
  openDelay = 400,
  closeDelay = 150,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  id,
  anchorRef,
  ...props
}: ReactTooltipProps) => {
  if (!children && !targetRef) {
    throw new Error('Tooltip must have a child or a targetRef');
  }

  const buttonList = buttons
    ? Array.isArray(buttons)
      ? buttons
      : [buttons]
    : undefined;

  // Use the trigger hook for state management and accessibility
  const { triggerRef, tooltipProps, isOpen } = useTooltipTrigger({
    targetRef,
    trigger,
    describeTarget,
    open: openProp,
    defaultOpen,
    onOpenChange,
    openDelay,
    closeDelay,
    id,
  });

  const positioningRef = anchorRef || triggerRef;
  const [toolbarAutoAxis, setToolbarAutoAxis] = useState<
    AnchorPositionAxis | undefined
  >();

  useEffect(() => {
    const orientation = positioningRef.current
      ?.closest<HTMLElement>('[data-udx-toolbar-orientation]')
      ?.getAttribute('data-udx-toolbar-orientation');
    setToolbarAutoAxis(
      orientation === 'vertical'
        ? 'horizontal'
        : orientation === 'horizontal'
          ? 'vertical'
          : undefined,
    );
  }, [isOpen, positioningRef]);

  const defaultPosition = variant === 'rich' ? 'bottom-right' : 'bottom';
  const effectivePosition =
    positionProp ?? (toolbarAutoAxis ? 'auto' : defaultPosition);
  const effectiveAutoAxis = autoAxisProp ?? toolbarAutoAxis ?? 'vertical';

  // The controller attaches native listeners to whatever `triggerRef` lands
  // on, so the child only needs the ref: its own React handlers keep working
  // alongside, with nothing to merge.
  const enhancedChildren =
    !targetRef && isValidElement(children)
      ? cloneElement(children, { ref: triggerRef } as never)
      : children;

  const styles = useTooltipStyle({
    variant,
    title,
    text,
    position: effectivePosition,
    trigger,
    describeTarget,
    openDelay,
    closeDelay,
    open: openProp,
    defaultOpen,
    id,
    isOpen,
    className,
    transition,
  });

  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const transitionControllerRef = useRef<TooltipTransitionController | null>(
    null,
  );

  useEffect(() => {
    if (!surface) return undefined;
    const controller = createTooltipTransitionController({
      element: surface,
      transition,
    });
    transitionControllerRef.current = controller;
    controller.setOpen(isOpen, true);
    return () => {
      controller.destroy();
      transitionControllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface, transition?.duration, transition?.ease]);

  useEffect(() => {
    transitionControllerRef.current?.setOpen(isOpen);
  }, [isOpen]);

  return (
    <>
      {enhancedChildren}
      {/* The positioner's box is only a carrier: it must never catch a
          pointer, or its transparent area covers whatever sits under the
          anchor. The surface opts back in with `pointer-events-auto`. */}
      <AnchorPositioner
        anchorRef={positioningRef}
        position={effectivePosition}
        autoAxis={effectiveAutoAxis}
        style={{ pointerEvents: 'none' }}
      >
        <div
          ref={setSurface}
          style={{ opacity: 0 }}
          inert={!isOpen}
          className={styles.toolTip}
          {...(props as any)}
          {...tooltipProps}
        >
          <div className={styles.container}>
            {content ? (
              <div className={styles.content}>{content}</div>
            ) : (
              <>
                {title && <div className={styles.subHead}>{title}</div>}
                {text && <div className={styles.supportingText}>{text}</div>}
                {buttonList && (
                  <div className={styles.actions}>
                    {buttonList.map((buttonArgs, index) => (
                      <Button
                        key={index}
                        size={'small'}
                        variant={'text'}
                        edgeAligned
                        {...buttonArgs}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </AnchorPositioner>
    </>
  );
};
