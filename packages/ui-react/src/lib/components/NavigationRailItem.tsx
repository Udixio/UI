import React, {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import type { Transition } from 'motion';

import { Icon } from '../icon';
import {
  classNames,
  type NavigationRailItemInterface,
  navigationRailItemStyle,
  type ReactProps,
  resolveNavigationRailItemSelection,
} from '@udixio/core';
import {
  createNavigationRailItemLabelController,
  type NavigationRailItemLabelController,
} from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';
import { State } from '../effects';

/** Payload emitted when an item becomes the selected one. */
export type NavigationRailItemSelectedEvent = Pick<
  NavigationRailItemInterface['props'],
  'label' | 'icon'
> & {
  index: number;
  ref: RefObject<any>;
};

export type ReactNavigationRailItemProps =
  ReactProps<NavigationRailItemInterface> & {
    // `children` sert de repli de `label` → typé string (comme Fab / IconButton)
    children?: string;
    href?: string;
    transition?: Transition;
    setSelectedItem?: Dispatch<SetStateAction<number | null>>;
    onItemSelected?: (args: NavigationRailItemSelectedEvent) => void;
  };

export const useNavigationRailItemStyle = createUseStyle(
  navigationRailItemStyle,
);

/**
 * A single destination inside a `NavigationRail`; renders as a link when
 * `href` is provided, otherwise as a button.
 * @status beta
 * @parent NavigationRail
 * @devx
 * - Selection is index-based and provided by the parent rail.
 * - `extendedOnly` hides items when the rail is collapsed.
 * - The label reveal (width/height + opacity, on `extended` changes) is
 *   driven by a shared `@udixio/core/dom` Motion controller, the same one
 *   the Angular adapter uses.
 * @a11y
 * - Exposes `aria-current="page"` when selected, since the rail is a
 *   navigation landmark rather than a tabbed panel switcher.
 * @limitations
 * - No arrow-key navigation between items; relies on the native sequential
 *   tab order (a roving tabindex is only required for `tablist`/`listbox`
 *   widgets, which this is not).
 */
export const NavigationRailItem = ({
  className,
  onClick,
  label,
  variant = 'vertical',
  href,
  icon,
  selectedItem,
  setSelectedItem,
  index,
  onItemSelected,
  selected = false,
  ref,
  transition,
  isExtended,
  iconSelected,
  style,
  extendedOnly,
  children,
  ...restProps
}: ReactNavigationRailItemProps) => {
  if (children) label = children;

  const defaultRef = useRef<any>(null);
  const resolvedRef = ref || defaultRef;

  const isSelected = resolveNavigationRailItemSelection({
    selectedItem,
    index,
    selected,
  });

  useEffect(() => {
    if (selectedItem == index && onItemSelected) {
      onItemSelected({
        ref: resolvedRef as any,
        index: index || 0,
        label,
        icon,
      });
    }
  }, [selectedItem, index, onItemSelected, label, icon, resolvedRef]);

  // The label is always mounted in both positions (horizontal, inside the
  // container; vertical, after it); a shared `@udixio/core/dom` controller
  // animates whichever one matches the current variant, so neither adapter
  // has to coordinate an exit-animation-before-unmount sequence.
  const variantRef = useRef(variant);
  variantRef.current = variant;
  const horizontalLabelRef = useRef<HTMLSpanElement | null>(null);
  const verticalLabelRef = useRef<HTMLSpanElement | null>(null);
  const horizontalController = useRef<NavigationRailItemLabelController | null>(
    null,
  );
  const verticalController = useRef<NavigationRailItemLabelController | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!horizontalLabelRef.current || !verticalLabelRef.current) return;

    horizontalController.current = createNavigationRailItemLabelController({
      label: horizontalLabelRef.current,
      axis: () => 'horizontal',
      visible: () => variantRef.current === 'horizontal',
      duration: transition?.duration ?? 0.3,
    });
    verticalController.current = createNavigationRailItemLabelController({
      label: verticalLabelRef.current,
      axis: () => 'vertical',
      visible: () => variantRef.current === 'vertical',
      duration: transition?.duration ?? 0.3,
    });

    return () => {
      horizontalController.current?.destroy();
      verticalController.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    horizontalController.current?.update();
    verticalController.current?.update();
  }, [variant]);

  const ElementType = href ? 'a' : 'button';

  const handleClick = (e: React.MouseEvent<any>) => {
    if (setSelectedItem) {
      setSelectedItem(index ?? null);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const styles = useNavigationRailItemStyle({
    label,
    icon,
    iconSelected,
    selected,
    variant,
    index,
    selectedItem,
    isExtended,
    extendedOnly,
    isSelected,
    className,
  });

  transition = { duration: 0.3, ...transition };

  if (extendedOnly && !isExtended) return null;

  return (
    <ElementType
      {...(restProps as any)}
      aria-current={isSelected ? 'page' : undefined}
      ref={resolvedRef as any}
      href={href}
      className={styles.navigationRailItem}
      onClick={handleClick}
      style={{ transition: transition.duration + 's', ...style }}
    >
      <div
        style={{
          transition:
            variant == 'horizontal'
              ? transition.duration +
                `s, gap ${transition.duration! / 2}s ${transition.duration! - transition.duration! / 2}s`
              : transition.duration +
                `s, gap ${transition.duration! / 3}s ${transition.duration! - transition.duration! / 3}s`,
        }}
        className={styles.container}
      >
        <State
          style={{ transition: transition.duration + 's' }}
          className={styles.stateLayer}
          colorName={classNames({
            'on-surface': !isSelected,
            'on-secondary-container': isSelected,
          })}
          stateClassName={'state-ripple-group-[navigation-rail-item]'}
        />
        {icon && (
          <Icon
            icon={isSelected ? iconSelected : icon}
            className={styles.icon}
          />
        )}
        <span
          ref={horizontalLabelRef}
          className={styles.label}
          style={{ overflow: 'hidden' }}
        >
          {label}
        </span>
      </div>
      <span
        ref={verticalLabelRef}
        className={styles.label}
        style={{ overflow: 'hidden' }}
      >
        {label}
      </span>
    </ElementType>
  );
};
