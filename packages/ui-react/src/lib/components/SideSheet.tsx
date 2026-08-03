import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { iClose } from '@udixio/icons-rounded-400/close';
import {
  type ReactProps,
  type SideSheetInterface,
  sideSheetStyle,
} from '@udixio/core';
import {
  createSideSheetController,
  createSideSheetTransitionController,
  type SideSheetTransitionController,
} from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { Divider } from './Divider';
import { IconButton } from './IconButton';

export type { SideSheetPosition, SideSheetVariant } from '@udixio/core';

export type ReactSideSheetProps = ReactProps<SideSheetInterface> & {
  children?: ReactNode;
  /** Notifies an accepted open-state request. */
  onOpenChange?: (open: boolean) => void;
  /** Portal target for `variant="modal"`. Defaults to `document.body`. */
  container?: Element | null;
};

export const useSideSheetStyle = createUseStyle(sideSheetStyle);

/**
 * Side sheets show secondary content anchored to the side of the screen.
 * @status beta
 * @category Layout
 * @devx
 * - `open` is controlled; `defaultOpen` initializes uncontrolled usage. Defaults to `true`.
 * - `variant="modal"` renders into a portal on `document.body` by default; pass `container` to
 *   portal elsewhere (for example to confine a demo to a bounded box). It renders nothing on the
 *   server and during the first client render, then portals once mounted.
 * - `divider` is ignored for `variant="modal"`, which never renders one.
 * - The open/close width and backdrop transitions are implemented once with Motion JavaScript in
 *   `@udixio/core/dom`, so React and Angular share the same timing, reduced-motion behavior, and
 *   cleanup. No `motion/react` is used.
 * @a11y
 * - `variant="modal"` renders `role="dialog"` and `aria-modal`, traps focus by making every other
 *   child of `document.body` (or `container`) inert while open, moves initial focus into the panel,
 *   closes on Escape, restores focus to the previously focused element on close, and locks body
 *   scroll.
 * - Whichever variant, the panel is `inert` and `aria-hidden` while closed, and reduced-motion
 *   preference keeps state changes immediate and fully perceivable.
 * - `variant="standard"` is persistent layout chrome: no dialog role, focus trap, or Escape handling.
 * - `title`, when provided, labels the panel through `aria-labelledby`.
 * @limitations
 * - `children` stay mounted while closed, since the panel is always present for its open/close
 *   animation; expensive subtrees are not torn down until the `SideSheet` itself unmounts.
 * - The open/close animation transitions `width`, not a transform, so it can be less smooth for a
 *   very large panel or on a low-powered device.
 */
export const SideSheet = ({
  variant = 'standard',
  className,
  children,
  title,
  position = 'right',
  open: openProp,
  defaultOpen = true,
  divider,
  onOpenChange,
  closeIcon = iClose,
  transition,
  container,
  ...rest
}: ReactSideSheetProps) => {
  const isModal = variant === 'modal';

  const [isOpen, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    componentName: 'SideSheet',
    stateName: 'open',
  });

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const rawTitleId = useId();
  const titleId = `side-sheet-title-${rawTitleId.replace(/:/g, '')}`;

  const styles = useSideSheetStyle({
    variant,
    title,
    position,
    open: openProp,
    defaultOpen,
    closeIcon,
    divider,
    transition,
    isOpen,
    className,
  });

  const transitionControllerRef = useRef<SideSheetTransitionController | null>(
    null,
  );
  const skipNextOpenEffectRef = useRef(true);

  useEffect(() => {
    if (isModal && !isMounted) return;
    if (!panelRef.current) return;
    const controller = createSideSheetTransitionController({
      container: panelRef.current,
      overlay: overlayRef.current,
      transition,
    });
    transitionControllerRef.current = controller;
    controller.setOpen(isOpen, true);
    return () => {
      controller.destroy();
      if (transitionControllerRef.current === controller) {
        transitionControllerRef.current = null;
      }
    };
  }, [isModal, isMounted, transition]);

  useEffect(() => {
    if (skipNextOpenEffectRef.current) {
      skipNextOpenEffectRef.current = false;
      return;
    }
    transitionControllerRef.current?.setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (!isModal || !isOpen || !panelRef.current) return;
    const controller = createSideSheetController({
      panel: panelRef.current,
      overlay: overlayRef.current,
      container: container ?? document.body,
      onDismiss: () => setOpen(false),
    });
    return () => controller.destroy();
  }, [isModal, isOpen, isMounted, container, setOpen]);

  const showDivider = isModal ? false : (divider ?? true);

  const render = () => (
    <>
      {isModal && (
        <div
          ref={overlayRef}
          onClick={() => setOpen(false)}
          aria-hidden="true"
          inert={!isOpen}
          className={styles.overlay}
        />
      )}
      <div
        {...rest}
        ref={panelRef}
        className={styles.sideSheet}
        role={isModal ? 'dialog' : undefined}
        aria-modal={isModal ? true : undefined}
        aria-labelledby={title ? titleId : undefined}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className={styles.container}>
          <div className={styles.header}>
            {title && (
              <p id={titleId} className={styles.title}>
                {title}
              </p>
            )}
            <IconButton
              size={'small'}
              label={title ? `Close ${title}` : 'Close'}
              icon={closeIcon}
              onClick={() => setOpen(false)}
              className={styles.closeButton}
            ></IconButton>
          </div>
          <div className={styles.content}>{children}</div>
        </div>
        {showDivider && (
          <Divider className={styles.divider} orientation="vertical" />
        )}
      </div>
    </>
  );

  if (isModal) {
    return isMounted
      ? createPortal(render(), container ?? document.body)
      : null;
  }

  return render();
};
