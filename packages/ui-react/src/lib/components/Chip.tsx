import {
  type ChipInterface,
  chipStyle,
  classNames,
  getChipSelectionTransition,
  type ReactProps,
} from '@udixio/core';
import type { Transition } from 'motion';
import { Icon } from '../icon';
import { State } from '../effects';
import React, { useEffect, useRef, useState } from 'react';
import { iCheck } from '@udixio/icons-rounded-400/check';
import { iClose } from '@udixio/icons-rounded-400/close';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';

export type ReactChipProps = Omit<ReactProps<ChipInterface>, 'ref'> & {
  // `children` sert de repli de `label` → typé string (comme l'ancien contrat)
  children?: string;
  transition?: Transition;
  ref?: React.Ref<HTMLButtonElement | HTMLAnchorElement>;
};

export const useChipStyle = createUseStyle(chipStyle);

/**
 * Chips prompt most actions in a UI
 * @status beta
 * @category Action
 * @devx
 * - `editable` relies on contentEditable; label should be a string.
 * - Use `selected` with `onSelectedChange` for controlled selection, or
 *   `defaultSelected` for uncontrolled selection.
 * @a11y
 * - Uses `aria-pressed` only in selection mode.
 * - Disabled links lose their navigation target and tab stop.
 * @limitations
 * - Edit mode starts after a 1s focus delay (no prop to customize).
 */
export const Chip = ({
  variant = 'outlined',
  disabled = false,
  icon,
  href,
  label,
  className,
  onClick,
  onSelectedChange,
  selected,
  defaultSelected,
  ref,
  onRemove,
  draggable = false,
  editable,
  onEditStart,
  onEditCommit,
  onEditCancel,
  onChange,
  transition,
  children,
  editing,
  // Handlers utilisateur composés avec les handlers internes
  onFocus: userOnFocus,
  onBlur: userOnBlur,
  onKeyDown: userOnKeyDown,
  onDragStart: userOnDragStart,
  onDragEnd: userOnDragEnd,
  onDoubleClick: userOnDoubleClick,
  ...restProps
}: ReactChipProps) => {
  if (children) label = children;
  // Allow empty string when editable (newly created chips start empty)
  if (label === undefined && !editable) {
    throw new Error(
      'Chip component requires either a label prop or children content',
    );
  }

  const ElementType = href ? 'a' : 'button';

  const defaultRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const resolvedRef = ref || defaultRef;

  const [isSelected, setSelected] = useControllableState({
    value: selected,
    defaultValue: defaultSelected ?? false,
    onChange: onSelectedChange,
    componentName: 'Chip',
    stateName: 'selected',
  });
  const [isFocused, setIsFocused] = React.useState(false);
  const [internalEditing, setInternalEditing] = useState(false);
  const isEditing = !!editable && (editing ?? internalEditing);
  const [isDragging, setIsDragging] = React.useState(false);
  const [editValue, setEditValue] = React.useState<string>(
    typeof label === 'string' ? label : '',
  );
  const editSpanRef = React.useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (editable && isFocused && !isEditing) {
      // Délai de 1 seconde avant d'activer l'édition
      const timerId = setTimeout(() => {
        // Ignore l'édition si draggable et en cours de dragging
        if (draggable && isDragging) {
          return;
        }
        if (editing === undefined) {
          setInternalEditing(true);
        }
        onEditStart?.();
      }, 1000);

      // Cleanup: annule le timer si le focus est perdu avant 1 seconde
      return () => clearTimeout(timerId);
    } else if (!isFocused) {
      // Désactive l'édition immédiatement si le focus est perdu
      if (editing === undefined) {
        setInternalEditing(false);
      }
    }
    return;
  }, [
    isFocused,
    editable,
    isDragging,
    draggable,
    isEditing,
    editing,
    onEditStart,
  ]);

  // Sync edit value and focus caret when entering editing mode
  useEffect(() => {
    if (isEditing) {
      setEditValue(typeof label === 'string' ? label : '');
      // focus contenteditable span and move caret to end
      const el =
        (labelRef.current as unknown as HTMLSpanElement) || editSpanRef.current;
      if (el) {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [isEditing]);

  transition = { duration: 0.3, ...transition };

  const handleClick = (e: React.MouseEvent<any, MouseEvent>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (isSelectable) {
      const transition = getChipSelectionTransition({
        disabled,
        selected: isSelected,
      });
      if (transition.nextSelected !== undefined) {
        setSelected(transition.nextSelected);
      }
    }
    onClick?.(e);
  };

  const isSelectable =
    selected !== undefined ||
    defaultSelected !== undefined ||
    onSelectedChange !== undefined;
  const isInteractive =
    isSelectable || !!onRemove || !!onClick || !!href || !!editable;

  if (isSelected) {
    icon = iCheck;
  }

  const hasTrailingIcon = !!onRemove && !isEditing;

  const trailingIconHandlers = {
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault(); // ⬅️ clé
      e.stopPropagation();
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) {
        onRemove?.();
      }
    },
  };

  const styles = useChipStyle({
    // props
    label,
    variant,
    disabled,
    icon,
    selected,
    defaultSelected,
    onSelectedChange,
    onRemove,
    href,
    draggable,
    editable,
    editing,
    onEditStart,
    onEditCommit,
    onEditCancel,
    onChange,
    // states
    isSelected,
    isFocused,
    isInteractive,
    isDragging,
    isEditing,
    trailingIcon: hasTrailingIcon,
    className,
  });

  const labelRef = useRef(null);

  const handleCommit = () => {
    const trimmed = (editValue ?? '').trim();
    if (editing === undefined) {
      setInternalEditing(false);
    }
    if (!trimmed) {
      if (onRemove) {
        onRemove();
      }
      return;
    }
    onEditCommit?.(trimmed);
  };

  return (
    <ElementType
      contentEditable={false}
      ref={resolvedRef}
      className={styles.chip}
      {...(restProps as any)}
      onClick={(e: React.MouseEvent<any>) => {
        if (!isEditing) handleClick(e);
      }}
      draggable={!disabled && draggable}
      onDragStart={(e: React.DragEvent<any>) => {
        if (!disabled && draggable) {
          setIsDragging(true);
        }
        userOnDragStart?.(e);
      }}
      onDragEnd={(e: React.DragEvent<any>) => {
        if (draggable) {
          setIsDragging(false);
        }
        userOnDragEnd?.(e);
      }}
      onDoubleClick={(e: React.MouseEvent<any>) => {
        if (!disabled && editable && !isEditing) {
          if (editing === undefined) {
            setInternalEditing(true);
          }
          onEditStart?.();
          e.preventDefault();
          e.stopPropagation();
        }
        userOnDoubleClick?.(e);
      }}
      onFocus={(e: React.FocusEvent<any>) => {
        if (isInteractive) {
          setIsFocused(true);
        }
        userOnFocus?.(e);
      }}
      onBlur={(e: React.FocusEvent<any>) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) {
          return;
        }
        setIsFocused(false);
        userOnBlur?.(e);
      }}
      onKeyDown={(e: React.KeyboardEvent<any>) => {
        const key = e.key;

        // While editing: handle commit/cancel locally
        if (!disabled && isEditing) {
          if (key === 'Enter') {
            e.preventDefault();
            handleCommit();
          } else if (key === 'Escape') {
            e.preventDefault();
            if (editing === undefined) {
              setInternalEditing(false);
            }
            onEditCancel?.();
          } else if (
            onRemove &&
            editValue?.trim() === '' &&
            (key === 'Backspace' || key === 'Delete' || key === 'Del')
          ) {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }
          return;
        }

        // Only handle keys when focused/selected and not disabled
        if (!disabled && isFocused) {
          // Start editing with F2 or Enter when editable and no toggle behavior
          if (editable && !isSelectable && (key === 'F2' || key === 'Enter')) {
            e.preventDefault();
            if (editing === undefined) {
              setInternalEditing(true);
            }
            onEditStart?.();
            return;
          }

          // Toggle active state on Enter or Space when togglable
          if (
            isSelectable &&
            (key === 'Enter' || key === ' ' || key === 'Spacebar')
          ) {
            e.preventDefault();
            const transition = getChipSelectionTransition({
              disabled,
              selected: isSelected,
            });
            if (transition.nextSelected !== undefined) {
              setSelected(transition.nextSelected);
            }
          }

          // Trigger remove on Backspace or Delete when removable
          if (
            onRemove &&
            (key === 'Backspace' || key === 'Delete' || key === 'Del')
          ) {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }
        }

        // Delegate to user handler last
        userOnKeyDown?.(e);
      }}
      {...(href
        ? {
            href: disabled ? undefined : href,
            'aria-disabled': disabled || undefined,
            tabIndex: disabled ? -1 : undefined,
          }
        : { disabled, type: 'button' })}
      aria-pressed={isSelectable ? isSelected : undefined}
      style={{ transition: transition.duration + 's' }}
    >
      {isInteractive && !disabled && !isEditing && (
        <State
          style={{ transition: transition.duration + 's' }}
          className={styles.stateLayer}
          colorName={classNames({
            'on-surface-variant': !isSelected,
            'on-secondary-container': isSelected,
          })}
          stateClassName={'state-ripple-group-[chip]'}
        />
      )}

      {icon && <Icon icon={icon} className={styles.leadingIcon} />}
      <span
        ref={labelRef}
        contentEditable={!!editable && !!isEditing}
        suppressContentEditableWarning
        className={styles.label}
        role={editable ? 'textbox' : undefined}
        spellCheck={false}
        onInput={(e) => {
          const text = (e.currentTarget as HTMLSpanElement).innerText;
          setEditValue(text);
          onChange?.(text);
        }}
        onBlur={() => {
          if (editable && isEditing) {
            handleCommit();
          }
        }}
        onKeyDown={(e) => {
          // prevent line breaks inside contenteditable
          if (editable && isEditing && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleCommit();
            return;
          }
          if (editable && isEditing && e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            if (editing === undefined) {
              setInternalEditing(false);
            }
            onEditCancel?.();
          }
        }}
      >
        {label}
      </span>
      {hasTrailingIcon && (
        <span className={styles.trailingIcon} {...trailingIconHandlers}>
          <Icon icon={iClose} className="size-full" />
        </span>
      )}
    </ElementType>
  );
};
