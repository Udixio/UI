import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ContextMenuProps } from '@udixio/core';
import {
  createContextMenuController,
  resolveContextMenuPosition,
  resolveBoxElement,
  showContextMenuPopover,
} from '@udixio/core/dom';
import { Menu } from './Menu';

const useBrowserLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

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
 * @a11y Supports native context-menu events and Shift+F10, focuses the first item without scrolling the page, and restores trigger focus after Escape.
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
  const getTriggerRect = () => {
    const triggerHost = triggerRef.current;
    return triggerHost
      ? resolveBoxElement(triggerHost).getBoundingClientRect()
      : undefined;
  };

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

  useBrowserLayoutEffect(() => {
    if (!position) return;
    const menu = menuRef.current;
    const ownerWindow = menu?.ownerDocument.defaultView;
    if (!menu || !ownerWindow) return;
    const popup = menu.parentElement;
    if (popup) showContextMenuPopover(popup);

    const menuRect = menu.getBoundingClientRect();
    const documentElement = menu.ownerDocument.documentElement;
    const nextPosition = resolveContextMenuPosition(
      position,
      { width: menuRect.width, height: menuRect.height },
      {
        width: documentElement.clientWidth || ownerWindow.innerWidth,
        height: documentElement.clientHeight || ownerWindow.innerHeight,
      },
    );
    if (nextPosition.x !== position.x || nextPosition.y !== position.y) {
      setPosition(nextPosition);
    }
  }, [position]);

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
    openAt(event.clientX, event.clientY);
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
            const rect = getTriggerRect();
            openAt(rect?.left ?? 0, rect?.bottom ?? 0);
          }
        }}
      >
        {trigger}
      </span>
      {position && (
        <div
          className="fixed z-50 rounded-lg"
          popover="manual"
          style={{
            inset: 'auto',
            margin: 0,
            top: position.y,
            left: position.x,
            right: 'auto',
            bottom: 'auto',
            maxWidth: 'calc(100vw - 16px)',
            maxHeight: 'calc(100vh - 16px)',
            overflow: 'auto',
          }}
        >
          <Menu
            ref={menuRef}
            purpose="actions"
            variant={variant}
            accessibleLabel={accessibleLabel}
          >
            {children}
          </Menu>
        </div>
      )}
    </div>
  );
};
