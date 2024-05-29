import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { StyleProps, StylesHelper } from '../../utils';
import { SliderStyle } from './SliderStyle';

export interface SliderState {
  value: number;
  min: number;
  max: number;
  isChanging: boolean;
}

export type SliderElement =
  | 'slider'
  | 'activeTrack'
  | 'handle'
  | 'inactiveTrack';

export interface SliderProps
  extends StyleProps<Omit<SliderState, 'isChanging'>, SliderElement>,
    SliderState,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'value'> {}

export const Slider = forwardRef<HTMLDivElement, SliderProps>((args, ref) => {
  const { className, min = 0, max = 100, ...restProps }: SliderProps = args;
  const [isChanging, setIsChanging] = useState(false);
  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef: React.RefObject<any> | React.ForwardedRef<any> =
    ref || defaultRef;

  const [value, setValue] = useState(args.value);
  const [pourcent, setPourcent] = useState(
    ((args.value - min) / (max - min)) * 100
  );
  const [mouseDown, setMouseDown] = useState(false);
  const handleMouseDown = (e) => {
    setMouseDown(true);
    setIsChanging(true);
    handleChange(e);
  };

  const handleMouseUp = () => {
    setMouseDown(false);
    setIsChanging(false);
  };
  useEffect(() => {
    if (mouseDown) {
      // Add mouse events
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleChange);
      // Add touch events
      window.addEventListener('touchend', handleMouseUp);
      window.addEventListener('touchmove', handleChange);
    } else {
      // Remove mouse events
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleChange);
      // Remove touch events
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleChange);
    }

    return () => {
      // Cleanup - remove both mouse and touch events
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleChange);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleChange);
    };
  }, [mouseDown]);

  const getClassNames = (() => {
    return StylesHelper.classNamesElements<SliderState, SliderElement>({
      default: 'slider',
      classNameList: [className, SliderStyle],
      states: {
        value,
        max,
        min,
        isChanging,
      },
    });
  })();
  const handleChange = (event) => {
    // @ts-ignore
    const current = resolvedRef?.current;
    if (current) {
      const refPosition = current.getBoundingClientRect().left;

      const clientX =
        event.type === 'touchmove' || event.type === 'touchstart'
          ? event.touches[0].clientX
          : event.clientX;

      let pourcent = Math.floor(
        ((clientX - refPosition) / current.offsetWidth) * 100
      );
      if (pourcent > 100) pourcent = 100;
      if (pourcent < 0) pourcent = 0;

      const amount = ((max - min) * pourcent) / 100 + min;
      setValue(amount);
      setPourcent(pourcent);
    }
  };

  return (
    <div
      className={getClassNames.slider}
      onMouseDown={handleMouseDown}
      onClick={handleChange}
      ref={resolvedRef}
      onTouchStart={handleMouseDown}
      {...restProps}
    >
      <div
        className={getClassNames.activeTrack}
        style={{ flex: pourcent / 100 }}
      ></div>
      <div className={getClassNames.handle}></div>
      <div
        className={getClassNames.inactiveTrack}
        style={{ flex: 1 - pourcent / 100 }}
      ></div>
    </div>
  );
});
