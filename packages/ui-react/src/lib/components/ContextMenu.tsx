import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnchorPositioner } from './AnchorPositioner';
import { Menu, type ReactMenuProps } from './Menu';

export type ContextMenuProps = ReactMenuProps & {
  trigger?: ReactNode;
};

export const ContextMenu = ({
  trigger,
  children,
  ...menuProps
}: ContextMenuProps) => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleSelect = () => {
    handleClose();
  };

  useEffect(() => {
    if (!contextMenu) return;
    const handleOutsideInteraction = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideInteraction);
    window.addEventListener('scroll', handleOutsideInteraction, true);

    return () => {
      window.removeEventListener('click', handleOutsideInteraction);
      window.removeEventListener('scroll', handleOutsideInteraction, true);
    };
  }, [contextMenu]);

  // Clone trigger if valid element to attach onContextMenu, otherwise wrap
  const triggerElement = React.isValidElement(trigger) ? (
    React.cloneElement(
      trigger as React.ReactElement,
      {
        onContextMenu: (e: React.MouseEvent) => {
          handleContextMenu(e);
          // Call original handler if exists
          (trigger as React.ReactElement).props.onContextMenu?.(e);
        },
      } as any,
    )
  ) : (
    <div onContextMenu={handleContextMenu} className="inline-block">
      {trigger}
    </div>
  );

  return (
    <>
      {triggerElement}

      {/* Invisible anchor element positioned at cursor */}
      <div
        ref={anchorRef}
        style={{
          position: 'fixed',
          top: contextMenu?.mouseY ?? 0,
          left: contextMenu?.mouseX ?? 0,
          width: 1,
          height: 1,
          pointerEvents: 'none',
          visibility: 'hidden',
        }}
      />

      {contextMenu && (
        <AnchorPositioner
          anchorRef={anchorRef}
          position="bottom right"
          onClick={(e) => e.stopPropagation()}
        >
          <Menu onClick={handleSelect} {...menuProps}>
            {children}
          </Menu>
        </AnchorPositioner>
      )}
    </>
  );
};
