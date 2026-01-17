import { classNames, ReactProps } from '../utils';
import { ChipInterface } from '../interfaces';
import { useChipStyle } from '../styles';
import { Icon } from '../icon';
import { State } from '../effects';
import React, { useEffect, useRef, useState } from 'react';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

/**
 * Chips prompt most actions in a UI
 * @status beta
 * @category Action
 */
export const Chip = ({
  variant = 'outlined',
  disabled = false,
  icon,
  href,
  label,
  className,
  onClick,
  onToggle,
  activated,
  ref,
  onRemove,
  editable,
  onEditStart,
  onEditCommit,
  onEditCancel,
  onChange,
  transition,
  children,
  editing,
  ...restProps
}: ReactProps<ChipInterface>) => {
  if (children) label = children;
  // Allow empty string when editable (newly created chips start empty)
  if (label === undefined && !editable) {
    throw new Error(
      'Chip component requires either a label prop or children content',
    );
  }

  const ElementType = href ? 'a' : 'button';

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef = ref || defaultRef;

  const [isActive, setIsActive] = React.useState(activated);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isEditing, setIsEditing] = useState(editing && editable);
  const [isDragging, setIsDragging] = React.useState(false);
  const [editValue, setEditValue] = React.useState<string>(
    typeof label === 'string' ? label : '',
  );
  const editSpanRef = React.useRef<HTMLSpanElement>(null);
  useEffect(() => {
    setIsActive(activated);
  }, [activated]);

  useEffect(() => {
    if (editing) {
      setIsEditing(editing);
    }
    if (editable && isFocused) {
      // Délai de 1 seconde avant d'activer l'édition
      const timerId = setTimeout(() => {
        // Ignore l'édition si draggable et en cours de dragging
        if ((restProps as any)?.draggable && isDragging) {
          return;
        }
        setIsEditing(true);
      }, 1000);

      // Cleanup: annule le timer si le focus est perdu avant 1 seconde
      return () => clearTimeout(timerId);
    } else if (!isFocused) {
      // Désactive l'édition immédiatement si le focus est perdu
      setIsEditing(false);
    }
    return;
  }, [isFocused, editable, isDragging, restProps, editValue]);

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
    }
    if (onToggle) {
      setIsActive(!isActive);
      onToggle(!isActive);
    } else if (onClick) {
      onClick(e);
    }
  };

  const isInteractive =
    !!onToggle || !!onRemove || !!onClick || !!href || !!editable;

  if (activated) {
    icon = faCheck;
  }

  // Extract potential onFocus/onBlur from rest props to compose handlers
  const {
    onFocus: restOnFocus,
    onBlur: restOnBlur,
    onKeyDown: restOnKeyDown,
    onDragStart: restOnDragStart,
    onDragEnd: restOnDragEnd,
    onDoubleClick: restOnDoubleClick,
    ...rest
  } = (restProps as any) ?? {};

  const styles = useChipStyle({
    href,
    disabled,
    icon,
    variant,
    transition,
    className,
    isActive: isActive ?? false,
    onToggle,
    activated: isActive,
    label,
    isInteractive,
    children: label,
    isFocused: isFocused,
    isDragging,
    onEditCommit,
    isEditing,
  });

  const labelRef = useRef(null);

  const handleCommit = () => {
    const trimmed = (editValue ?? '').trim();
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
      href={href}
      className={styles.chip}
      {...(rest as any)}
      onClick={(e: React.MouseEvent<any>) => {
        if (!isEditing) handleClick(e);
      }}
      draggable={!disabled && !!(restProps as any)?.draggable}
      onDragStart={(e: React.DragEvent<any>) => {
        if (!disabled && (restProps as any)?.draggable) {
          setIsDragging(true);
        }
        restOnDragStart?.(e);
      }}
      onDragEnd={(e: React.DragEvent<any>) => {
        if ((restProps as any)?.draggable) {
          setIsDragging(false);
        }
        restOnDragEnd?.(e);
      }}
      onDoubleClick={(e: React.MouseEvent<any>) => {
        if (!disabled && editable && !isEditing) {
          onEditStart?.();
          e.preventDefault();
          e.stopPropagation();
        }
        restOnDoubleClick?.(e);
      }}
      onFocus={(e: React.FocusEvent<any>) => {
        if (isInteractive) {
          setIsFocused(true);
        }
        restOnFocus?.(e);
      }}
      onBlur={(e: React.FocusEvent<any>) => {
        setIsFocused(false);
        restOnBlur?.(e);
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
          if (editable && !onToggle && (key === 'F2' || key === 'Enter')) {
            e.preventDefault();
            onEditStart?.();
            return;
          }

          // Toggle active state on Enter or Space when togglable
          if (
            onToggle &&
            (key === 'Enter' || key === ' ' || key === 'Spacebar')
          ) {
            e.preventDefault();
            const next = !isActive;
            setIsActive(next);
            onToggle(next);
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
        restOnKeyDown?.(e);
      }}
      disabled={disabled}
      aria-pressed={onToggle ? isActive : undefined}
      style={{ transition: transition.duration + 's' }}
    >
      {isInteractive && !disabled && !isEditing && (
        <State
          style={{ transition: transition.duration + 's' }}
          className={styles.stateLayer}
          colorName={classNames({
            'on-surface-variant': !isActive,
            'on-secondary-container': isActive,
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
        onBlur={(e) => {
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
            onEditCancel?.();
          }
        }}
      >
        {label}
      </span>
      {onRemove && !isEditing && (
        <Icon
          icon={faXmark}
          className={styles.trailingIcon}
          onMouseDown={(e) => {
            e.preventDefault(); // ⬅️ clé
            e.stopPropagation();
          }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            if (!disabled) {
              onRemove();
            }
          }}
        />
      )}
    </ElementType>
  );
};
