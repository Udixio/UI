import React, { useLayoutEffect, useRef } from 'react';
import {
  getSwitchChangeTransition,
  getSwitchHandleOffset,
  switchStyle,
  type ReactProps,
  type SwitchInterface,
} from '@udixio/core';
import {
  createSwitchThumbController,
  type SwitchThumbController,
} from '@udixio/core/dom';
import { Icon } from '../icon';
import { State } from '../effects';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';

export type ReactSwitchProps = Omit<ReactProps<SwitchInterface>, 'onChange'> & {
  /** Called once for each accepted checked-state transition. */
  onCheckedChange?: (checked: boolean) => void;
};

export const useSwitchStyle = createUseStyle(switchStyle);

/**
 * Switches toggle the selection of a single item on or off.
 * @status beta
 * @category Input
 * @devx
 * - Use `checked` with `onCheckedChange` for controlled state, or `defaultChecked` for uncontrolled state.
 * - The thumb slide is driven by a shared `@udixio/core/dom` Anime.js tween controller, the same one the Angular
 *   adapter uses -- an accepted exception to the rest of `@udixio/core/dom`, which uses Motion.
 * @a11y
 * - Renders `role="switch"` with `aria-checked` and standard Space/Enter activation.
 * @limitations
 * - The component does not render a visible label; provide one with `aria-label` or `aria-labelledby`.
 */
export const Switch = ({
  checked,
  defaultChecked = false,
  className,
  activeIcon,
  disabled = false,
  inactiveIcon,
  onCheckedChange,
  onClick,
  onKeyDown,
  ref,
  ...restProps
}: ReactSwitchProps) => {
  const [isChecked, setChecked] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
    componentName: 'Switch',
    stateName: 'checked',
  });

  const handleToggle = () => {
    const transition = getSwitchChangeTransition({ disabled, isChecked });
    if (!transition.blocked) setChecked(transition.nextChecked);
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    handleToggle();
    onClick?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleToggle();
    }
    onKeyDown?.(event);
  };

  const styles = useSwitchStyle({
    className,
    isChecked,
    activeIcon,
    inactiveIcon,
    disabled,
    checked,
    defaultChecked,
  });

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef: React.RefObject<any> | React.ForwardedRef<any> =
    ref || defaultRef;

  const handleContainerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SwitchThumbController | null>(null);
  const isFirstUpdateRef = useRef(true);

  useLayoutEffect(() => {
    const root = handleContainerRef.current;
    if (!root) return;

    isFirstUpdateRef.current = true;
    const controller = createSwitchThumbController({ root });
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    // This effect also fires once on mount (React runs every effect on
    // first render, dependency array or not) -- animating then would slide
    // the handle in from the *other* resting offset, as if it had just been
    // toggled, even though it rendered at the right spot the whole time.
    // Only real `isChecked` transitions after mount should ever animate.
    if (isFirstUpdateRef.current) {
      isFirstUpdateRef.current = false;
      return;
    }
    controllerRef.current?.update(
      getSwitchHandleOffset(!isChecked),
      getSwitchHandleOffset(isChecked),
    );
  }, [isChecked]);

  const resolvedIcon = isChecked ? activeIcon : inactiveIcon;

  return (
    <div
      {...restProps}
      role="switch"
      aria-checked={isChecked}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      ref={resolvedRef}
      className={styles.switch}
    >
      <div
        ref={handleContainerRef}
        style={{ translate: `${getSwitchHandleOffset(isChecked)}px` }}
        className={styles.handleContainer}
      >
        <State
          stateClassName="state-ripple-group-[switch]"
          className={styles.stateLayer}
          colorName={isChecked ? 'primary' : 'on-surface'}
        />
        <div className={styles.handle}>
          {resolvedIcon && <Icon className={styles.icon} icon={resolvedIcon} />}
        </div>
      </div>
    </div>
  );
};
