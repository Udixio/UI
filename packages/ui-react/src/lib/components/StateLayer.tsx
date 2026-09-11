import {
  stateLayerStyle,
  type ComponentClassName,
  type StateLayerInterface,
  type StateLayerProps,
} from '@udixio/core';
import {
  createStateLayerController,
  findStateLayerTrigger,
  type StateLayerController,
} from '@udixio/core/dom';
import { useEffect, useRef, type CSSProperties } from 'react';
import { createUseStyle } from '../utils/create-use-style';

export type ReactStateLayerProps = StateLayerProps &
  ComponentClassName<StateLayerInterface> & {
    style?: CSSProperties;
  };

/**
 * Paints the Material 3 state layer over its trigger, and drives the press
 * ripple.
 *
 * @status beta
 * @category Interaction
 * @devx
 * - Building block used by every interactive component (`Button`, `Chip`, `Switch`, ...); it is
 *   rendered inside the element it decorates, never standalone.
 * - `colorName` is a theme token without the `--color-` prefix, and it is the
 *   content colour of the surface being decorated -- `on-primary` on a filled
 *   button, `on-primary-container` once that button is repainted onto a
 *   container. An unknown token degrades to `on-surface`.
 * - `stateClassName` selects the Tailwind utility driving the CSS states. The
 *   `state-ripple-group-[name]` form pairs with a `group/name` class on the
 *   trigger, and the layer attaches its ripple to that same element, so the
 *   CSS states and the JavaScript gesture always agree on what the trigger is.
 * - `state-layer` (the non-group form) is CSS-only: no ripple is wired.
 * @a11y
 * - Decorative only: the layer carries `aria-hidden` and takes no pointer
 *   events, so it never reaches the accessibility tree nor intercepts input.
 * - The press ripple honours the reduced-motion preference through the shared
 *   controller.
 * @limitations
 * - The trigger is resolved by walking up to the outermost ancestor carrying
 *   the named Tailwind group, so the layer must be rendered inside it.
 * - The set of valid `colorName` tokens lives in `@udixio/theme`, which
 *   `@udixio/core` does not depend on, so the prop is typed as `string`.
 */
export const StateLayer = ({
  style,
  colorName,
  stateClassName = 'state-ripple-group',
  shapeTransition,
  className,
}: ReactStateLayerProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const controllerRef = useRef<StateLayerController>(null);
  const shapeTransitionRef = useRef(shapeTransition);
  shapeTransitionRef.current = shapeTransition;
  const styles = useStateLayerStyle({
    stateClassName,
    className,
    colorName,
    shapeTransition,
  });

  useEffect(() => {
    const layer = ref.current;
    if (!layer) {
      return;
    }

    const trigger = findStateLayerTrigger(layer, stateClassName);
    if (!trigger) {
      return;
    }

    const controller = createStateLayerController({
      trigger,
      layer,
      disabled: () => trigger.matches(':disabled, [aria-disabled="true"]'),
    });
    controllerRef.current = controller;
    controller.updateShape(shapeTransitionRef.current);

    return () => {
      controller.destroy();
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
  }, [stateClassName]);

  useEffect(() => {
    controllerRef.current?.updateShape(shapeTransition);
  }, [shapeTransition]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={styles.stateLayer}
      style={{
        ['--state-color' as any]: `var(--color-${colorName}, var(--color-on-surface))`,
        ...style,
      }}
    />
  );
};

export const useStateLayerStyle = createUseStyle(stateLayerStyle);
