import React, { useEffect, useRef, useState } from 'react';
import { AnchorPositioner } from './AnchorPositioner';
import { Menu } from './Menu';
// import { MenuProps } from '../interfaces/menu.interface'; // MenuProps is not exported from interface file usually, check file content
import { MenuInterface } from '../interfaces';
import { ReactProps } from '../utils';

// MenuInterface has props: MenuProps.
// But MenuProps might not be exported directly from the package index, so accessing it via MenuInterface['props'] is safer if we can't import it.
// Actually checking Step 1271, MenuProps IS exported.

export type ContextMenuProps = {
  props: { trigger: React.ReactNode } & MenuInterface['props'];
  type: 'div';
  states: {
    hasGroups: boolean;
  };
  elements: [''];
};

export const ContextMenu = ({
  trigger,
  children,
  ...menuProps
}: ReactProps<ContextMenuProps>) => {
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
