import type { SplitButtonProps } from '../interfaces/split-button.interface';
import type { IconButtonVariant } from '../interfaces/icon-button.interface';

export type SplitButtonOpenReason = 'trigger' | 'keyboard' | 'dismiss';

export interface SplitButtonOpenState {
  isOpen: boolean;
  disabled: boolean;
}

export interface SplitButtonOpenTransition extends SplitButtonOpenState {
  reason: SplitButtonOpenReason;
}

export type SplitButtonOpenResult =
  { blocked: true } | { blocked: false; nextOpen: boolean };

/** Maps the SplitButton variants to the available IconButton treatments. */
export function getSplitButtonMenuVariant(
  variant: SplitButtonProps['variant'] = 'filled',
): IconButtonVariant {
  return variant === 'elevated' ? 'standard' : variant;
}

/** Validates the shared accessible-name and action requirements. */
export function isSplitButtonValid(
  props: Pick<
    SplitButtonProps,
    'label' | 'icon' | 'accessibleLabel' | 'menuLabel' | 'actions'
  >,
): boolean {
  const hasPrimaryLabel = (props.label?.trim() ?? '') !== '';
  const actionIds = props.actions.map(({ id }) => id);
  return (
    (props.menuLabel?.trim() ?? '') !== '' &&
    props.actions.length > 0 &&
    actionIds.every((id) => id.trim() !== '') &&
    new Set(actionIds).size === actionIds.length &&
    props.actions.every((action) => action.label.trim() !== '') &&
    (!!props.icon || hasPrimaryLabel) &&
    (hasPrimaryLabel || (props.accessibleLabel?.trim() ?? '') !== '')
  );
}

/** Resolves the shared open-state transition for pointer and keyboard input. */
export function getSplitButtonOpenTransition({
  isOpen,
  disabled,
  reason,
}: SplitButtonOpenTransition): SplitButtonOpenResult {
  if (disabled && reason !== 'dismiss') return { blocked: true };

  if (reason === 'trigger') {
    return { blocked: false, nextOpen: !isOpen };
  }

  return { blocked: false, nextOpen: reason === 'keyboard' };
}
