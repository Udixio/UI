import { classNames, ReactProps } from '../utils';
import { ChipInterface } from '../interfaces';
import { useChipStyle } from '../styles';
import { Icon } from '../icon';
import { State } from '../effects';
import React, { useEffect, useRef } from 'react';
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
  selected,
  onClick,
  onToggle,
  activated,
  ref,
  onRemove,
  editable,
  isEditing,
  onEditStart,
  onEditCommit,
  onEditCancel,
  onChange,
  transition,
  children,
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
  const [isSelected, setIsSelected] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [editValue, setEditValue] = React.useState<string>(
    typeof label === 'string' ? label : '',
  );
  const editSpanRef = React.useRef<HTMLSpanElement>(null);
  useEffect(() => {
    setIsActive(activated);
  }, [activated]);

  useEffect(() => {
    if (selected !== undefined) {
      setIsActive(selected);
    }
  }, [selected]);

  // Sync edit value and focus caret when entering editing mode
  useEffect(() => {
    if (isEditing) {
      setEditValue(typeof label === 'string' ? label : '');
      // focus contenteditable span and move caret to end
      const el = (labelRef.current as unknown as HTMLSpanElement) || editSpanRef.current;
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

  const isInteractive = !!onToggle || !!onRemove || !!onClick || !!href;

  // Selection (focus visual + keyboard safety) is enabled only for interactive or removable chips
  const selectionEnabled = isInteractive || !!onRemove;

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
    selected: isSelected && selectionEnabled,
    isSelected: isSelected && selectionEnabled,
    isDragging,
    isEditing,
  });

  const labelRef = useRef(null);

  return (
    <ElementType
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
        if (selectionEnabled) {
          setIsSelected(true);
        }
        restOnFocus?.(e);
      }}
      onBlur={(e: React.FocusEvent<any>) => {
        setIsSelected(false);
        restOnBlur?.(e);
      }}
      onKeyDown={(e: React.KeyboardEvent<any>) => {
        // While editing: handle commit/cancel locally
        if (!disabled && isEditing) {
          if (e.key === 'Enter') {
            e.preventDefault();
            onEditCommit?.(editValue);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onEditCancel?.();
          }
          return;
        }

        // Only handle keys when focused/selected and not disabled
        if (!disabled && selectionEnabled && isSelected) {
          const key = e.key;

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
            onEditCommit?.(editValue);
          }
        }}
        onKeyDown={(e) => {
          // prevent line breaks inside contenteditable
          if (editable && isEditing && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            onEditCommit?.(editValue);
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
      {/*{isEditing && (*/}
      {/*  <span*/}
      {/*    ref={editSpanRef}*/}
      {/*    className={styles.label}*/}
      {/*   */}
      {/*    suppressContentEditableWarning*/}
      {/*    role="textbox"*/}
      {/*    spellCheck={false}*/}
      {/*    onInput={(e) => setEditValue((e.currentTarget as HTMLSpanElement).innerText)}*/}
      {/*    onFocus={(e) => e.stopPropagation()}*/}
      {/*    onBlur={() => {*/}
      {/*      onEditCommit?.(editValue);*/}
      {/*    }}*/}
      {/*    onKeyDown={(e) => {*/}
      {/*      // prevent line breaks in contenteditable*/}
      {/*      if (e.key === 'Enter') e.preventDefault();*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    {editValue}*/}
      {/*  </span>*/}
      {/*)}*/}
      {onRemove && (
        <Icon
          icon={faXmark}
          className={styles.trailingIcon}
          onClick={(e: React.MouseEvent) => {
            console.log('click');
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
