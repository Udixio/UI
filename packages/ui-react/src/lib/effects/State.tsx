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
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { createUseStyle } from '../utils/create-use-style';

export type ReactStateLayerProps = StateLayerProps &
  ComponentClassName<StateLayerInterface> & {
    style?: CSSProperties;
    children?: ReactNode;
  };

export const State = ({
  style,
  colorName,
  stateClassName = 'state-ripple-group',
  shapeTransition,
  children,
  className,
}: ReactStateLayerProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const controllerRef = useRef<StateLayerController>(null);
  const shapeTransitionRef = useRef(shapeTransition);
  shapeTransitionRef.current = shapeTransition;
  const styles = useStateStyle({
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
        ['--state-color' as any]: `var(--default-color, var(--color-${colorName}))`,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const useStateStyle = createUseStyle(stateLayerStyle);
