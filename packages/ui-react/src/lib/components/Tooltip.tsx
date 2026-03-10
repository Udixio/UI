import { cloneElement, isValidElement, useEffect, useRef } from 'react';
import { MotionProps } from '../utils';
import { Button } from './Button';
import { AnchorPositioner } from './AnchorPositioner';
import { ToolTipInterface } from '../interfaces';
import { useToolTipStyle } from '../styles';
import { AnimatePresence, motion } from 'motion/react';
import { useTooltipTrigger } from '../hooks';

/**
 * Tooltips display brief labels or messages
 * @status beta
 * @category Communication
 * @devx
 * - `content` overrides `title`/`text`/`buttons` for fully custom content.
 * - Supports controlled `isOpen` plus `openDelay`/`closeDelay`.
 * @a11y
 * - Provides `role="tooltip"` and `aria-describedby` when open.
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
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
  id,
  anchorRef,
  ...props
}: MotionProps<ToolTipInterface>) => {
  const defaultPosition = variant === 'rich' ? 'bottom-right' : 'bottom';
  const effectivePosition = positionProp || defaultPosition;

  transition = { duration: 0.3, ...transition };

  if (!children && !targetRef) {
    throw new Error('Tooltip must have a child or a targetRef');
  }

  if (buttons && !Array.isArray(buttons)) {
    buttons = [buttons];
  }

  const internalRef = useRef<HTMLElement | null>(null);
  const resolvedRef = targetRef || internalRef;
  const positioningRef = anchorRef || resolvedRef;

  // Use the trigger hook for state management and accessibility
  const { triggerProps, tooltipProps, isOpen } = useTooltipTrigger({
    trigger,
    isOpen: isOpenProp,
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

    const handleMouseEnter = () => triggerProps.onMouseEnter();
    const handleMouseLeave = () => triggerProps.onMouseLeave();
    const handleFocus = () => triggerProps.onFocus();
    const handleBlur = () => triggerProps.onBlur();
    const handleClick = () => triggerProps.onClick();
    const handleKeyDown = (event: KeyboardEvent) =>
      triggerProps.onKeyDown(event as unknown as React.KeyboardEvent);

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
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
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('focus', handleFocus, true);
      element.removeEventListener('blur', handleBlur, true);
      element.removeEventListener('click', handleClick);
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [targetRef, triggerProps]);

  const styles = useToolTipStyle({
    variant,
    buttons,
    className,
    title,
    text,
    position: effectivePosition,
    trigger,
    targetRef: targetRef as any,
    children: children as any,
  });

  const variants = {
    open: {
      opacity: 1,
      height: 'auto',
    },
    close: {
      opacity: 0,
      height: 16,
    },
  };

  return (
    <>
      {enhancedChildren}
      <AnimatePresence>
        {isOpen && (
          <AnchorPositioner
            anchorRef={positioningRef}
            position={effectivePosition}
          >
            <motion.div
              initial={'close'}
              variants={variants}
              animate={'open'}
              transition={{ duration: transition.duration }}
              exit={'close'}
              className={styles.toolTip}
              {...props}
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
                    {buttons && (
                      <div className={styles.actions}>
                        {Array.isArray(buttons) &&
                          buttons.map((buttonArgs, index) => (
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
            </motion.div>
          </AnchorPositioner>
        )}
      </AnimatePresence>
    </>
  );
};
