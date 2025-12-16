import React from 'react';
import { ReactProps } from '../utils';
import { ChipItem, ChipsInterface } from '../interfaces';
import { useChipsStyle } from '../styles';
import { Chip } from './Chip';

export const Chips = ({
  variant = 'input',
  className,
  scrollable = true,
  items,
  onItemsChange,
  onCreate,
  onCreateStart,
  onCreateCommit,
  onCreateCancel,
}: ReactProps<ChipsInterface>) => {
  const list = items ?? [];

  // Editing management (only for variant 'input')
  const [editingId, setEditingId] = React.useState<string | number | null>(
    null,
  );
  // Track newly created items that aren't finalized yet
  const [creatingIds, setCreatingIds] = React.useState<Set<string | number>>(
    () => new Set(),
  );
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

  // MODE ITEMS (source de vérité locale ou contrôlée)
  return (
    <div
      role="list"
      aria-label="Chips"
      className={styles.chips}
      onMouseDown={(e) => {
        // Add new chip only when clicking on empty area of the container
        if (variant !== 'input') return;
        if (e.target !== e.currentTarget) return;
        const newId = `__chip_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        const extra = onCreate?.({ id: newId }) ?? {};
        const newItem: ChipItem = {
          id: newId,
          label: '',
          ...extra,
        } as ChipItem;
        const next = [...list, newItem];
        onItemsChange?.(next);
        setCreatingIds((prev) => {
          const n = new Set(prev);
          n.add(newId);
          return n;
        });
        setEditingId(newId);
        onCreateStart?.(newItem);
        // Focus will be handled after render by focusing the chip element if possible
        requestAnimationFrame(() => {
          const idx = list.length; // appended at the end
          const el = chipRefs.current[idx] as any;
          el?.focus?.();
        });
      }}
    >
      {list.map((item, index) => {
        const isInputVariant = variant === 'input';
        const editProps = isInputVariant
          ? {
              editable: true,
              isEditing: editingId === item.id,
              onEditStart: () => {
                setEditingId(item.id);
              },
              onEditCommit: (next: string | undefined) => {
                setEditingId(null);
                const trimmed = (next ?? '').trim();
                const isCreating = creatingIds.has(item.id);
                if (!trimmed) {
                  if (isCreating) {
                    onCreateCancel?.(item.id);
                    setCreatingIds((prev) => {
                      const n = new Set(prev);
                      n.delete(item.id);
                      return n;
                    });
                  }
                  removeAt(index);
                  return;
                }
                let committedItem: ChipItem | null = null;
                updateItems((prev) =>
                  prev.map((it) => {
                    if (it.id === item.id) {
                      committedItem = { ...it, label: trimmed } as ChipItem;
                      return committedItem;
                    }
                    return it;
                  }),
                );
                if (isCreating && committedItem) {
                  setCreatingIds((prev) => {
                    const n = new Set(prev);
                    n.delete(item.id);
                    return n;
                  });
                  onCreateCommit?.(committedItem);
                }
              },
              onEditCancel: () => {
                setEditingId(null);
                const isCreating = creatingIds.has(item.id);
                if (isCreating || !item.label || item.label.trim() === '') {
                  onCreateCancel?.(item.id);
                  setCreatingIds((prev) => {
                    const n = new Set(prev);
                    n.delete(item.id);
                    return n;
                  });
                  removeAt(index);
                }
              },
              onChange: (next: string) => {
                // live update label while editing (without committing)
                updateItems((prev) =>
                  prev.map((it) =>
                    it.id === item.id ? { ...it, label: next } : it,
                  ),
                );
              },
            }
          : {};

        return (
          <Chip
            key={item.id}
            ref={(el: any) => (chipRefs.current[index] = el)}
            label={item.label ?? ''}
            icon={item.icon}
            activated={item.activated}
            disabled={item.disabled}
            variant={item.variant}
            href={item.href}
            draggable={item.draggable}
            {...editProps}
            onToggle={
              item.activated === undefined
                ? undefined
                : (next) =>
                    updateItems((prev) =>
                      prev.map((it) =>
                        it.id === item.id ? { ...it, activated: next } : it,
                      ),
                    )
            }
            onRemove={isInputVariant ? () => removeAt(index) : undefined}
          />
        );
      })}
    </div>
  );
};
