import { useEffect, useRef } from 'react';
import { iClose } from '@udixio/icons-rounded-400/close';
import {
  type ReactProps,
  type SnackbarInterface,
  snackbarStyle,
} from '@udixio/core';
import {
  createSnackbarAutoDismissController,
  createSnackbarTransitionController,
  type SnackbarTransitionController,
} from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { IconButton } from './IconButton';

export type ReactSnackbarProps = ReactProps<SnackbarInterface> & {
  /** Notifies an accepted open-state request. */
  onOpenChange?: (open: boolean) => void;
};

export const useSnackbarStyle = createUseStyle(snackbarStyle);

/**
 * Snackbars show a brief, non-blocking status message about an app process.
 * @status beta
 * @category Communication
 * @devx
 * - `open` is controlled; `defaultOpen` initializes uncontrolled usage. Defaults to `true`.
 * - `duration` (ms) auto-dismisses the snackbar; omit it to require an explicit `onOpenChange`
 *   or a click on the built-in close button.
 * - Renders in normal document flow at the call site. Fixed/bottom positioning, stacking, and
 *   queueing multiple snackbars are the caller's responsibility.
 * - The height transition is implemented once with Motion JavaScript in `@udixio/core/dom`,
 *   shared with Angular. It applies the initial `open` state immediately; only transitions
 *   after the first render animate.
 * @a11y
 * - Renders `role="status"` and `aria-live="polite"` so assistive technology announces the
 *   message without interrupting the user. The element stays mounted and `inert` while closed
 *   instead of unmounting, so the live region is reliably present before it announces.
 * @limitations
 * - No built-in queue/stacking for multiple simultaneous snackbars.
 */
export const Snackbar = ({
  message,
  className,
  duration,
  closeIcon = iClose,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  transition,
  style,
  ...restProps
}: ReactSnackbarProps) => {
  const [isOpen, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    componentName: 'Snackbar',
    stateName: 'open',
  });

  const styles = useSnackbarStyle({
    className,
    closeIcon,
    duration,
    open: openProp,
    defaultOpen,
    isOpen,
    message,
    transition,
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SnackbarTransitionController | null>(null);

  useEffect(() => {
    if (!panelRef.current) return;
    const controller = createSnackbarTransitionController({
      panel: panelRef.current,
      open: isOpen,
      transition,
    });
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controllerRef.current?.setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !duration) return;
    const controller = createSnackbarAutoDismissController({
      duration,
      onDismiss: () => setOpen(false),
    });
    return () => controller.destroy();
  }, [isOpen, duration, setOpen]);

  return (
    <div
      {...restProps}
      ref={panelRef}
      style={{ ...style, height: isOpen ? undefined : 0 }}
      className={styles.snackbar}
      role="status"
      aria-live="polite"
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <div className={styles.container}>
        <p className={styles.supportingText}>{message}</p>
        <IconButton
          onClick={() => setOpen(false)}
          className={styles.icon}
          icon={closeIcon}
          label="Close the snackbar"
        />
      </div>
    </div>
  );
};
