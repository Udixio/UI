import React, { useEffect, useState } from 'react';
import { ReactProps } from '../utils';
import { ChipItem, ChipsInterface } from '../interfaces';
import { useChipsStyle } from '../styles';
import { Chip } from './Chip';
import { Divider } from './Divider';
import { v4 } from 'uuid';

export const Chips = ({
  variant = 'input',
  className,
  scrollable = true,
  draggable = false,
  items,
  onItemsChange,
}: ReactProps<ChipsInterface>) => {
  const list = items ?? [];

  const ref = React.useRef<HTMLDivElement>(null);

  const [isFocused, setIsFocused] = React.useState<boolean>(false);

  // Internal stable ids per item object (since ChipItem no longer exposes id)
  const idMapRef = React.useRef<WeakMap<ChipItem, string>>(new WeakMap());
  const getInternalId = React.useCallback((it: ChipItem) => {
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
      ref.current?.focus();
    }
  }, [isFocused]);

  const chipRefs = React.useRef<(HTMLElement | null)[]>([]);

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
    scrollable,
    className,
    variant,
  });

  const createAndStartEdit = React.useCallback(
    (seedLabel = '') => {
      if (variant !== 'input') return;

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
        const el = chipRefs.current[index] as any;
        el?.focus?.();

        const chipsEl = ref.current!;
        const scrollLeft =
          el.offsetLeft + el.offsetWidth / 2 - chipsEl.offsetWidth / 2;
        chipsEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedChip, list, getInternalId]);

  // MODE ITEMS (source de vérité locale ou contrôlée)
  return (
    <div
      ref={ref}
      role="list"
      aria-label="Chips"
      className={styles.chips}
      tabIndex={variant === 'input' ? 0 : undefined}
      onFocus={(e) => {
        if (e.target === e.currentTarget) {
          setIsFocused(true);
        }
      }}
      onBlur={() => setIsFocused(false)}
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
          const nextIdx = focusedIndex > 0 ? focusedIndex - 1 : list.length - 1;
          const elId = getInternalId(list[nextIdx]);
          setSelectedChip(elId);
          return;
        }
        if (key === 'ArrowRight') {
          e.preventDefault();
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
          const elId = getInternalId(list[0]);
          setSelectedChip(elId);
          return;
        }
        if (key === 'End') {
          e.preventDefault();
          const elId = getInternalId(list[list.length - 1]);
          setSelectedChip(elId);
          return;
        }

        if (isContainerFocused) {
          if (key === 'Enter') {
            e.preventDefault();
            createAndStartEdit('');
            return;
          }
          if (key === 'Backspace') {
            e.preventDefault();
            // Focus last chip if any
            if (list.length > 0) {
              const el = chipRefs.current[list.length - 1] as any;
              el?.focus?.();
            }
            return;
          }
          // Start creation when typing a printable character
          if (key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey) {
            createAndStartEdit(key);
            e.preventDefault();
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
              onEditCommit: (next: string | undefined) => {
                setIsFocused(true);
                updateItems((prev) =>
                  prev.map((it, i) =>
                    i === index ? { ...it, label: next as any } : it,
                  ),
                );
              },
              onEditCancel: () => {
                setIsFocused(true);
              },
              onChange: (next: ChipItem[]) => {
                if (chipRefs.current.length == index + 1) {
                  const el = ref.current!;
                  requestAnimationFrame(() => {
                    el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
                  });
                }
              },
            }
          : {};

        return (
          <Chip
            key={internalId}
            ref={(el: any) => (chipRefs.current[index] = el)}
            label={item.label ?? ''}
            icon={item.icon}
            activated={item.activated}
            disabled={item.disabled}
            variant={item.variant}
            href={item.href}
            draggable={draggable}
            {...editProps}
            onToggle={
              item.activated === undefined
                ? undefined
                : (next) =>
                    updateItems((prev) =>
                      prev.map((it, i) =>
                        i === index ? { ...it, activated: next } : it,
                      ),
                    )
            }
            onBlur={() => {
              if (selectedChip === internalId) {
                setSelectedChip(null);
              }
            }}
            onRemove={
              isInputVariant
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
    </div>
  );
};
