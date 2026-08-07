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
  type ReactProps,
  type TooltipInterface,
  tooltipStyle,
} from '@udixio/core';
import {
  addPointerEnterLeaveListener,
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

export type ReactTooltipProps<T extends HTMLElement = any> =
  ReactProps<TooltipInterface> & {
    /** Custom content slot that replaces title/text/buttons when provided */
    content?: ReactNode;
    buttons?: ReactButtonProps | ReactButtonProps[];
    /** Custom anchor for positioning. Defaults to the trigger element. */
    anchorRef?: RefObject<HTMLElement>;
    /** Notifies an accepted open-state request. */
    onOpenChange?: (open: boolean) => void;
  } & (
      | {
          children?: never;
          targetRef: RefObject<T>;
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
 * - The open/close opacity/scale transition is implemented once with
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
  targetRef,
  ref,
  trigger = ['hover', 'focus'],
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
  const defaultPosition = variant === 'rich' ? 'bottom-right' : 'bottom';
  const effectivePosition = positionProp || defaultPosition;

  if (!children && !targetRef) {
    throw new Error('Tooltip must have a child or a targetRef');
  }

  const buttonList = buttons
    ? Array.isArray(buttons)
      ? buttons
      : [buttons]
    : undefined;

  const internalRef = useRef<HTMLElement | null>(null);
  const resolvedRef = targetRef || internalRef;
  const positioningRef = anchorRef || resolvedRef;

  // Use the trigger hook for state management and accessibility
  const { triggerProps, tooltipProps, isOpen } = useTooltipTrigger({
    trigger,
    open: openProp,
    defaultOpen,
    onOpenChange,
    openDelay,
    closeDelay,
    id,
  });

  // Apply trigger props to the target element
  const enhancedChildren =
    !targetRef && isValidElement(children)
      ? cloneElement(children, {
          ref: internalRef,
          ...triggerProps,
          // Merge event handlers if the child already has them
          onMouseEnter: (e: React.MouseEvent) => {
            triggerProps.onMouseEnter();
            (children.props as any)?.onMouseEnter?.(e);
          },
          onMouseLeave: (e: React.MouseEvent) => {
            triggerProps.onMouseLeave();
            (children.props as any)?.onMouseLeave?.(e);
          },
          onFocus: (e: React.FocusEvent) => {
            triggerProps.onFocus();
            (children.props as any)?.onFocus?.(e);
          },
          onBlur: (e: React.FocusEvent) => {
            triggerProps.onBlur();
            (children.props as any)?.onBlur?.(e);
          },
          onClick: (e: React.MouseEvent) => {
            triggerProps.onClick();
            (children.props as any)?.onClick?.(e);
          },
          onKeyDown: (e: React.KeyboardEvent) => {
            triggerProps.onKeyDown(e);
            (children.props as any)?.onKeyDown?.(e);
          },
        } as any)
      : children;

  // Attach trigger handlers when using targetRef (no direct child to clone)
  useEffect(() => {
    if (!targetRef) return;
    const element = targetRef.current;
    if (!element) return;

    const handleFocus = () => triggerProps.onFocus();
    const handleBlur = () => triggerProps.onBlur();
    const handleClick = () => triggerProps.onClick();
    const handleKeyDown = (event: KeyboardEvent) =>
      triggerProps.onKeyDown(event as unknown as React.KeyboardEvent);

    // `mouseenter`/`mouseleave` never fire on an element that renders no box
    // of its own (for example a `display: contents` wrapper); go through
    // the bubbling-safe `mouseover`/`mouseout` equivalent instead, so a
    // `targetRef` pointed at such a wrapper still gets working hover.
    const removeHoverListener = addPointerEnterLeaveListener(element, {
      onEnter: () => triggerProps.onMouseEnter(),
      onLeave: () => triggerProps.onMouseLeave(),
    });
    element.addEventListener('focus', handleFocus, true);
    element.addEventListener('blur', handleBlur, true);
    element.addEventListener('click', handleClick);
    element.addEventListener('keydown', handleKeyDown);

    if (triggerProps['aria-describedby']) {
      element.setAttribute(
        'aria-describedby',
        triggerProps['aria-describedby'],
      );
    } else {
      element.removeAttribute('aria-describedby');
    }

    return () => {
      removeHoverListener();
      element.removeEventListener('focus', handleFocus, true);
      element.removeEventListener('blur', handleBlur, true);
      element.removeEventListener('click', handleClick);
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [targetRef, triggerProps]);

  const styles = useTooltipStyle({
    variant,
    title,
    text,
    position: effectivePosition,
    trigger,
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
  const skipNextOpenEffectRef = useRef(true);

  useEffect(() => {
    if (!surface) return undefined;
    const controller = createTooltipTransitionController({
      element: surface,
      transition,
    });
    transitionControllerRef.current = controller;
    controller.setOpen(isOpen, true);
    skipNextOpenEffectRef.current = true;
    return () => {
      controller.destroy();
      transitionControllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface, transition?.duration, transition?.ease]);

  useEffect(() => {
    if (skipNextOpenEffectRef.current) {
      skipNextOpenEffectRef.current = false;
      return;
    }
    transitionControllerRef.current?.setOpen(isOpen);
  }, [isOpen]);

  return (
    <>
      {enhancedChildren}
      <AnchorPositioner anchorRef={positioningRef} position={effectivePosition}>
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
                {text && (
                  <div className={styles.supportingText}>{text}</div>
                )}
                {buttonList && (
                  <div className={styles.actions}>
                    {buttonList.map((buttonArgs, index) => (
                      <Button
                        key={index}
                        size={'small'}
                        variant={'text'}
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
