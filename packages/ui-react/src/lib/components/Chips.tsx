import React from 'react';
import { Chip } from './Chip';
import { ReactProps } from '../utils';
import { ChipItem, ChipsInterface } from '../interfaces';
import { useChipsStyle } from '../styles';

export const Chips = ({
  variant = 'input',
  className,
  scrollable = true,
  items,
  onItemsChange,
}: ReactProps<ChipsInterface>) => {
  const list = items;

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
    <div role="chiplist" className={styles.chips}>
      {list?.map((item, index) => (
        <Chip
          key={item.id}
          label={item.label}
          icon={item.icon}
          activated={item.activated}
          disabled={item.disabled}
          variant={item.variant}
          href={item.href}
          draggable={item.draggable}
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
          onRemove={variant == 'input' ? () => removeAt(index) : undefined}
        />
      ))}
    </div>
  );
};
