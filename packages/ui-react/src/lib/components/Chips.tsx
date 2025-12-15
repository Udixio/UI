import React, { useRef, useState } from 'react';

import { Chip } from './Chip';
import { ReactProps } from '../utils';
import { ChipsInterface } from '../interfaces/chips.interface';
import { useChipsStyle } from '../styles/chips.style';
import { ChipProps } from '../interfaces';

/**
 * Chips organize content across different screens and views
 * @status beta
 * @category Navigation
 */
export const Chips = ({
  variant = 'input',
  children,
  className,
  scrollable = true,
}: ReactProps<ChipsInterface>) => {
  const [internalSelectedChip, internalSetSelectedChip] = useState<
    number | null
  >(null);

  let selectedChip: number | null;
  if (externalSelectedChip == 0 || externalSelectedChip != undefined) {
    selectedChip = externalSelectedChip;
  } else {
    selectedChip = internalSelectedChip;
  }

  const setSelectedChip = externalSetSelectedChip || internalSetSelectedChip;

  const chipChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Chip,
  );

  const ref = React.useRef<HTMLDivElement | null>(null);

  const styles = useChipsStyle({
    children,

    scrollable,
    selectedChip,
    setSelectedChip,
    className,
    variant,
  });

  const chipRefs = useRef<React.RefObject<HTMLElement>[]>([]);

  return (
    <div ref={ref} role="chiplist" className={styles.chips}>
      {chipChildren.map((child, index) => {
        // Ensure a ref exists for this chip index
        if (!chipRefs.current[index]) {
          chipRefs.current[index] = React.createRef<HTMLElement>();
        }

        const chipEl = child as React.ReactElement<ChipProps>;

        console.log(selectedChip, index);

        return React.cloneElement(chipEl, {
          ...chipEl.props,
          key: index,
          selected: selectedChip == index,
          draggable: true,
          ref: chipRefs.current[index],
          scrollable,
        });
      })}
    </div>
  );
};
