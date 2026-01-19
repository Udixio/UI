import { cloneElement, isValidElement, useRef } from 'react';
import { MotionProps } from '../utils';
import { Button } from './Button';
import { ToolTipInterface } from '../interfaces';
import { useToolTipStyle } from '../styles';
import { AnimatePresence, motion } from 'motion/react';
import { SyncedFixedWrapper } from '../effects';
import { useTooltipTrigger, useTooltipPosition } from '../hooks';

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
  ...props
}: MotionProps<ToolTipInterface>) => {
  transition = { duration: 0.3, ...transition };

  if (!children && !targetRef) {
    throw new Error('Tooltip must have a child or a targetRef');
  }

  if (buttons && !Array.isArray(buttons)) {
    buttons = [buttons];
  }

  const internalRef = useRef<HTMLElement | null>(null);
  const resolvedRef = targetRef || internalRef;

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

  // Use the position hook for auto-positioning
  const { resolvedPosition } = useTooltipPosition({
    targetRef: resolvedRef,
    position: positionProp,
    variant,
    isOpen,
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

  const styles = useToolTipStyle({
    variant,
    buttons,
    className,
    title,
    text,
    position: resolvedPosition,
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
          <SyncedFixedWrapper targetRef={resolvedRef}>
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
          </SyncedFixedWrapper>
        )}
      </AnimatePresence>
    </>
  );
};
