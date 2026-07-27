import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ContextMenuProps } from '@udixio/core';
import { createContextMenuController } from '@udixio/core/dom';
import { Menu } from './Menu';

export type ReactContextMenuProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'className'
> &
  Omit<ContextMenuProps, 'onOpenChange'> & {
    /** Element that receives pointer and Shift+F10 context-menu activation. */
    trigger: ReactNode;
    /** MenuItem, MenuGroup, and MenuHeadline content. */
    children?: ReactNode;
    /** Notifies visibility changes caused by user interaction. */
    onOpenChange?: (open: boolean) => void;
    /** Classes applied to the display-contents root. */
    className?: string;
  };

/**
 * Opens a Menu at the pointer or keyboard context-menu position.
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Project the trigger through `trigger` and Menu family elements as children.
 * @a11y Supports native context-menu events and Shift+F10, focuses the first item, and restores trigger focus after Escape.
 * @limitations The popup position is internally owned and is not controllable.
 */
export const ContextMenu = ({
  trigger,
  children,
  variant = 'standard',
  accessibleLabel,
  disabled = false,
  onOpenChange,
  className,
  ...restProps
}: ReactContextMenuProps) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);

  const close = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setPosition(null);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const openAt = useCallback(
    (x: number, y: number) => {
      if (disabled) return;
      const wasOpen = openRef.current;
      openRef.current = true;
      setPosition({ x, y });
      if (!wasOpen) onOpenChange?.(true);
    },
    [disabled, onOpenChange],
  );

  useEffect(() => {
    if (!position) return;
    const root = rootRef.current;
    const triggerHost = triggerRef.current;
    const menu = menuRef.current;
    const triggerElement =
      triggerHost?.querySelector<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]',
      ) ?? triggerHost;
    if (!root || !triggerElement || !menu) return;
    const controller = createContextMenuController({
      root,
      trigger: triggerElement,
      menu,
      onDismiss: close,
    });
    return () => controller.destroy();
  }, [close, position]);

  const handleContextMenu = (event: React.MouseEvent) => {
    if (disabled) return;
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    openAt(event.clientX || rect.left, event.clientY || rect.bottom);
  };

  return (
    <div
      {...restProps}
      ref={rootRef}
      className={className}
      style={{ display: 'contents' }}
    >
      <span
        ref={triggerRef}
        style={{ display: 'contents' }}
        onContextMenu={handleContextMenu}
        onKeyDown={(event) => {
          if (event.shiftKey && event.key === 'F10') {
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            openAt(rect.left, rect.bottom);
          }
        }}
      >
        {trigger}
      </span>
      {position && (
        <div
          className="fixed z-50"
          style={{ top: position.y, left: position.x }}
        >
          <Menu
            ref={menuRef}
            purpose="actions"
            variant={variant}
            accessibleLabel={accessibleLabel}
            onClick={close}
          >
            {children}
          </Menu>
        </div>
      )}
    </div>
  );
};
