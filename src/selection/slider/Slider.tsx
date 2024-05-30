import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { StyleProps, StylesHelper } from '../../utils';
import { SliderStyle } from './SliderStyle';

export interface SliderState {
  value: number;
  min: number;
  max: number;
  isChanging: boolean;
  marks?: {
    value: number;
    label?: string;
  }[];
  step: number;
}

export type SliderElement =
  | 'slider'
  | 'activeTrack'
  | 'handle'
  | 'inactiveTrack'
  | 'valueIndicator'
  | 'dot';

export interface SliderProps
  extends StyleProps<Omit<SliderState, 'isChanging'>, SliderElement>,
    SliderState,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'value'> {}

export const Slider = forwardRef<HTMLDivElement, SliderProps>((args, ref) => {
  const getPourcentFromValue = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const getValueFromPourcent = (pourcent: number) => {
    return ((max - min) * pourcent) / 100 + min;
  };
  const {
    className,
    min = 0,
    max = 100,
    step = 10,
    ...restProps
  }: SliderProps = args;
  const [isChanging, setIsChanging] = useState(false);
  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef: React.RefObject<any> | React.ForwardedRef<any> =
    ref || defaultRef;

  const [value, setValue] = useState(args.value);
  const [pourcent, setPourcent] = useState(getPourcentFromValue(args.value));
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
        step,
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

      let pourcent = ((clientX - refPosition) / current.offsetWidth) * 100;

      let value = getValueFromPourcent(pourcent);
      value = Math.round((value - min) / step) * step + min;

      pourcent = getPourcentFromValue(value);

      if (pourcent > 100) pourcent = 100;
      if (pourcent < 0) pourcent = 0;

      setValue(value);
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
      >
        {args.marks &&
          args.marks.map((mark, index) => {
            return (
              <div
                key={index}
                className={getClassNames.dot + ' bg-primary-container'}
                style={{
                  left: `calc(${
                    (getPourcentFromValue(mark.value) / pourcent) * 100
                  }% + 4px)`,
                }}
              ></div>
            );
          })}
      </div>
      <div className={getClassNames.handle}>
        {isChanging && (
          <div className={getClassNames.valueIndicator}>{value}</div>
        )}
      </div>
      <div
        className={getClassNames.inactiveTrack}
        style={{ flex: 1 - pourcent / 100 }}
      >
        {args.marks &&
          args.marks.map((mark, index) => {
            return (
              <div
                key={index}
                className={getClassNames.dot + ' bg-primary -translate-x-full'}
                style={{
                  left: `calc(${
                    ((getPourcentFromValue(mark.value) - pourcent) /
                      (100 - pourcent)) *
                    100
                  }% - 4px)`,
                }}
              ></div>
            );
          })}
      </div>
    </div>
  );
});
