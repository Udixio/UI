import React, { useEffect, useRef, useState } from 'react';
import {
  chipsStyle,
  type ChipItem,
  type ChipsInterface,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { Chip } from './Chip';
import { Divider } from './Divider';
import { v4 } from 'uuid';

export type ReactChipsProps = ReactProps<ChipsInterface>;

export const useChipsStyle = createUseStyle(chipsStyle);

/**
 * Chips group for input or selection lists
 * @status beta
 * @category Input
 * @devx
 * - Works best as controlled: pass `items` + `onItemsChange`.
 * - Prefer stable item ids; without one, ids follow object identity.
 * @a11y
 * - The collection has a configurable accessible label.
 * - Arrow, Home, End, Backspace, and Delete keys are supported in input mode.
 * @limitations
 * - No virtualization; very large lists can be slow.
 */
export const Chips = ({
  variant = 'input',
  label = 'Chips',
  className,
  scrollable = true,
  draggable = false,
  items,
  onItemsChange,
}: ReactChipsProps) => {
  const list = items ?? [];

  const ref = React.useRef<HTMLDivElement>(null);

  const [isFocused, setIsFocused] = React.useState<boolean>(false);

  // Fallback ids remain stable for item objects that do not expose an id.
  const idMapRef = React.useRef<WeakMap<ChipItem, string>>(new WeakMap());
  const getInternalId = React.useCallback((it: ChipItem) => {
    if (it.id) return it.id;
    const map = idMapRef.current;
    let id = map.get(it);
    if (!id) {
      id = v4();
      map.set(it, id);
    }
    return id;
  }, []);

  React.useEffect(() => {
    if (isFocused) {
      if (variant == 'input') {
        ghostChipRef.current?.focus();
      } else {
        ref.current?.focus();
      }
    }
  }, [isFocused]);

  const chipRefs = React.useRef<(HTMLElement | null)[]>([]);

  // Guard to prevent multiple chip creation from fast typing
  const isCreatingRef = React.useRef(false);

  const updateItems = React.useCallback(
    (updater: (prev: ChipItem[]) => ChipItem[]) => {
      onItemsChange?.(updater(list));
    },
    [onItemsChange, list],
  );

  const removeAt = React.useCallback(
    (index: number) => {
      updateItems((prev) => prev.filter((_, i) => i !== index));
    },
    [updateItems],
  );

  const styles = useChipsStyle({
    variant,
    label,
    scrollable,
    draggable,
    items,
    onItemsChange,
    className,
  });

  const createAndStartEdit = React.useCallback(
    (seedLabel = '') => {
      if (variant !== 'input') return;

      // Guard against multiple rapid creations
      if (isCreatingRef.current) return;
      isCreatingRef.current = true;

      const newItem: ChipItem = {
        label: seedLabel,
      } as ChipItem;

      // Generate internal ID for the new item
      const newId = getInternalId(newItem);

      // Ask parent to add as well
      const next = [...list, newItem];
      onItemsChange?.(next);

      requestAnimationFrame(() => {
        setSelectedChip(newId);
        // Reset guard after chip is selected
        isCreatingRef.current = false;
      });
    },
    [variant, onItemsChange, list, getInternalId],
  );

  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  useEffect(() => {
    if (selectedChip) {
      const index = list.findIndex(
        (item) => getInternalId(item) === selectedChip,
      );
      if (index !== -1) {
        const el = chipRefs.current[index];
        el?.focus?.();

        const chipsEl = ref.current;
        if (!chipsEl || !el) return;
        const scrollLeft =
          el.offsetLeft + el.offsetWidth / 2 - chipsEl.offsetWidth / 2;
        chipsEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedChip, list, getInternalId]);

  // MODE ITEMS (source de vérité locale ou contrôlée)

  const ghostChipRef = useRef<HTMLButtonElement>(null);

  const isGhostChip = (isFocused || list.length === 0) && variant === 'input';

  return (
    <div
      ref={ref}
      role="list"
      aria-label={label}
      className={styles.chips}
      tabIndex={variant === 'input' ? 0 : undefined}
      onFocus={(e) => {
        if (e.target === e.currentTarget) {
          setIsFocused(true);
        }
      }}
      onBlur={() => {
        setIsFocused(false);
      }}
      onKeyDown={(e) => {
        if (variant !== 'input') return;

        const key = e.key;
        const target = e.target as HTMLElement;
        const isContainerFocused = target === e.currentTarget;

        // If currently editing a chip, let the chip handle keys
        if (!isFocused) return;

        // Determine focused chip index if any
        const activeEl = document.activeElement as HTMLElement | null;
        const focusedIndex = chipRefs.current.findIndex(
          (el) => el === activeEl,
        );

        if (key === 'ArrowLeft') {
          e.preventDefault();
          if (list.length === 0) return;
          const nextIdx = focusedIndex > 0 ? focusedIndex - 1 : list.length - 1;
          const elId = getInternalId(list[nextIdx]);
          setSelectedChip(elId);
          return;
        }
        if (key === 'ArrowRight') {
          e.preventDefault();
          if (list.length === 0) return;
          const nextIdx =
            focusedIndex >= 0
              ? (focusedIndex + 1) % Math.max(1, list.length)
              : 0;
          const elId = getInternalId(list[nextIdx]);
          setSelectedChip(elId);
          return;
        }
        if (key === 'Home') {
          e.preventDefault();
          if (list.length === 0) return;
          const elId = getInternalId(list[0]);
          setSelectedChip(elId);
          return;
        }
        if (key === 'End') {
          e.preventDefault();
          if (list.length === 0) return;
          const elId = getInternalId(list[list.length - 1]);
          setSelectedChip(elId);
          return;
        }
        if (isContainerFocused) {
          if (key === 'Backspace') {
            e.preventDefault();
            // Focus last chip if any
            if (list.length > 0) {
              const el = chipRefs.current[list.length - 1] as any;
              el?.focus?.();
            }
            return;
          }
        }
      }}
    >
      {list.map((item, index) => {
        const internalId = getInternalId(item);
        const isInputVariant = variant === 'input';
        const editProps = isInputVariant
          ? {
              editable: true,
              editing: selectedChip === internalId,
              onEditCommit: (next: string) => {
                setIsFocused(true);
                updateItems((prev) =>
                  prev.map((it, i) =>
                    i === index ? { ...it, label: next } : it,
                  ),
                );
              },
              onEditCancel: () => {
                setIsFocused(true);
              },
              onChange: () => {
                if (chipRefs.current.length == index + 1) {
                  const el = ref.current;
                  if (!el) return;
                  requestAnimationFrame(() => {
                    el.scrollTo({
                      left: el.scrollWidth,
                      behavior: 'smooth',
                    });
                  });
                }
              },
            }
          : {};

        return (
          <Chip
            key={internalId}
            ref={(el: HTMLButtonElement | HTMLAnchorElement | null) => {
              chipRefs.current[index] = el;
            }}
            label={item.label ?? ''}
            icon={item.icon}
            selected={item.selected}
            disabled={item.disabled}
            variant={item.variant}
            href={item.href}
            draggable={draggable}
            {...editProps}
            onSelectedChange={
              item.selected === undefined
                ? undefined
                : (next) =>
                    updateItems((prev) =>
                      prev.map((it, i) =>
                        i === index ? { ...it, selected: next } : it,
                      ),
                    )
            }
            onBlur={() => {
              if (selectedChip === internalId) {
                setSelectedChip(null);
              }
            }}
            onRemove={
              isInputVariant || item.removable
                ? () => {
                    setIsFocused(true);
                    removeAt(index);
                  }
                : undefined
            }
          />
        );
      })}
      {isFocused && (
        <>
          <Divider
            orientation="vertical"
            className="animate-[var(--animate-blink)] border-outline"
            style={
              {
                '--animate-blink':
                  'blink 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              } as React.CSSProperties
            }
          />

          <style>
            {`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }
      `}
          </style>
        </>
      )}
      {isGhostChip && (
        <Chip
          ref={ghostChipRef}
          className="opacity-0"
          draggable={draggable}
          editable={true}
          editing={true}
          onChange={(v) => {
            v = v.replace(/(&nbsp;)+/g, ' ').trim();
            if (v) {
              createAndStartEdit(v);
            } else {
              if (list.length > 0) {
                const el = chipRefs.current[list.length - 1];
                el?.focus?.();
              }
            }
          }}
          onEditCommit={() => {
            // Ghost chip doesn't commit - it creates a new chip via onChange
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          onFocus={(e: React.FocusEvent) => {
            setIsFocused(true);
            e.stopPropagation();
          }}
        >
          &nbsp;
        </Chip>
      )}
    </div>
  );
};
