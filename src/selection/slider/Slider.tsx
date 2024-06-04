import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { StyleProps, StylesHelper } from '../../utils';
import { SliderStyle } from './SliderStyle';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';

export interface SliderState {
  value: number;
  min: number;
  max: number;
  isChanging: boolean;
  marks?: {
    value: number;
    label?: string;
  }[];
  step: number | null;
  name: string;
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
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'className' | 'value' | 'onChange'
    > {
  onChange?: (value: number) => void;
}

export const Slider = forwardRef<HTMLDivElement, SliderProps>((args, ref) => {
  const getPourcentFromValue = (value: number) => {
    const min = getMin();
    const max = getMax();

    if (value === Infinity) {
      return 100;
    } else if (value === -Infinity) {
      return 0;
    }
    return ((value - min) / (max - min)) * 100;
  };

  const getMax = (isInfinity = false) => {
    if (isInfinity) {
      return _max;
    }
    return _max == Infinity ? marks[marks?.length - 1].value : _max;
  };
  const getMin = (isInfinity = false) => {
    if (isInfinity) {
      return _min;
    }
    return _min == -Infinity ? marks[0].value : _min;
  };

  const getValueFromPourcent = (pourcent: number) => {
    const min = getMin(false);
    const max = getMax(false);
    return ((max - min) * pourcent) / 100 + min;
  };
  const {
    className,

    step = 10,
    name,
    marks = [
      {
        value: 0,
        label: '0',
      },
      {
        value: 100,
        label: '100',
      },
    ],
    onChange,
    ...restProps
  }: SliderProps = args;
  const _min = args.min ?? 0;
  const _max = args.max ?? 100;
  const [isChanging, setIsChanging] = useState(false);
  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef: React.RefObject<any> | React.ForwardedRef<any> =
    ref || defaultRef;

  const [value, setValue] = useState(args.value);
  const [pourcent, setPourcent] = useState(getPourcentFromValue(args.value));
  const [mouseDown, setMouseDown] = useState(false);
  const handleMouseDown = (e: any) => {
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
      // Cleanup - remove both mouse, touch and drag events
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
        max: getMax(true),
        min: getMin(true),
        isChanging,
        step,
        name,
      },
    });
  })();
  const handleChange = (event: any) => {
    // @ts-ignore
    const current = resolvedRef?.current;
    if (current) {
      const refPosition = current.getBoundingClientRect().left;

      const clientX =
        event.type === 'touchmove' || event.type === 'touchstart'
          ? event.touches[0].clientX
          : event.clientX;

      let pourcent = ((clientX - refPosition) / current.offsetWidth) * 100;

      updateSliderValues({ pourcent });
    }
  };
  const updateSliderValues = ({
    pourcent,
    value,
  }: {
    pourcent?: number;
    value?: number;
  }) => {
    if (pourcent) {
      if (pourcent >= 100) {
        setValue(getMax(true));
        setPourcent(100);
        return;
      }
      if (pourcent <= 0) {
        setValue(getMin(true));
        setPourcent(0);
        return;
      }

      value = getValueFromPourcent(pourcent);
      if (value == getMin()) {
        value = getMin(true);
      }
      if (value == getMax()) {
        value = getMax(true);
      }
    } else if (value != undefined) {
      if (value >= getMax()) {
        setValue(getMax(true));
        setPourcent(100);
        return;
      }
      if (value <= getMin()) {
        setValue(getMin(true));
        setPourcent(0);
        return;
      }
      pourcent = getPourcentFromValue(value);
    } else {
      return;
    }
    if (step != null) {
      value = Math.round((value - getMin()) / step) * step + getMin();
    } else if (marks) {
      value = marks.reduce((prev, curr, currentIndex) => {
        let currDiff =
          curr.value === Infinity
            ? getMax()
            : curr.value === -Infinity
              ? getMin()
              : curr.value;
        let prevDiff =
          prev.value === Infinity
            ? getMax()
            : prev.value === -Infinity
              ? getMin()
              : prev.value;
        currDiff = Math.abs(currDiff - value!);
        prevDiff = Math.abs(prevDiff - value!);

        return currDiff < prevDiff ? curr : prev;
      }).value;
    }

    if (value >= getMax()) {
      value = getMax(true);
    }
    if (value <= getMin()) {
      value = getMin(true);
    }

    pourcent = getPourcentFromValue(value);

    setValue(value);
    setPourcent(pourcent);
    if (onChange) {
      onChange(value);
    }
  };
  const [sliderWidth, setSliderWidth] = useState(0);
  useEffect(() => {
    const updateSliderWidth = () => {
      // @ts-ignore
      if (resolvedRef.current) {
        // @ts-ignore
        setSliderWidth(resolvedRef.current.offsetWidth);
      }
    };

    updateSliderWidth(); // Initial setup
    window.addEventListener('resize', updateSliderWidth);

    // Clean up
    return () => {
      window.removeEventListener('resize', updateSliderWidth);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Check which key is pressed
    switch (e.key) {
      case 'ArrowRight':
        if (step) {
          updateSliderValues({ value: value + step });
        } else if (marks) {
          // Find the next mark (greater than the current value)
          const nextMark = marks.find((mark) => mark.value > value);
          if (nextMark) {
            // If one exists, update the value to the mark's value
            updateSliderValues({ value: nextMark.value });
          }
        }
        break;

      case 'ArrowLeft':
        if (step) {
          updateSliderValues({ value: value - step });
        } else if (marks) {
          // Find the previous mark (less than the current value)
          const previousMark = marks
            .slice(0)
            .reverse()
            .find((mark) => mark.value < value);
          if (previousMark) {
            // If one exists, update the value to the mark's value
            updateSliderValues({ value: previousMark.value });
          }
        }
        break;
      default:
        return;
    }
  };
  return (
    <div
      tabIndex={0} // Make the slider focusable
      onKeyDown={handleKeyDown} // Attach the keydown event
      role="slider" // Inform assistive technologies about the type of the component
      aria-valuemin={getMin(true)} // Inform about the minimum value
      aria-valuemax={getMax(true)} // Inform about the maximum value
      aria-valuenow={value} // Inform about the current value
      aria-valuetext={value.toString()} // Textual representation of the value
      className={getClassNames.slider}
      onMouseDown={handleMouseDown}
      onClick={handleChange}
      ref={resolvedRef}
      onTouchStart={handleMouseDown}
      onDragStart={(e) => e.preventDefault()}
      {...restProps}
    >
      <input type="hidden" name={name} value={value} />
      <div
        className={getClassNames.activeTrack}
        style={{ flex: pourcent / 100 }}
      ></div>
      <div className={getClassNames.handle}>
        <AnimatePresence>
          {isChanging && (
            <motion.div
              className={getClassNames.valueIndicator}
              initial="hidden"
              animate="visible"
              exit="hidden"
              style={{
                translate: '-50%',
                transformOrigin: 'center bottom',
                textWrap: 'nowrap',
              }}
              variants={{
                visible: { opacity: 1, scale: 1 },
                hidden: { opacity: 1, scale: 0 },
              }}
              transition={{ duration: 0.1 }}
            >
              {value}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div
        className={getClassNames.inactiveTrack}
        style={{ flex: 1 - pourcent / 100 }}
      ></div>
      <div
        className={
          'w-[calc(100%-12px)] h-full absolute -translate-x-1/2 transform left-1/2'
        }
      >
        {marks &&
          marks.map((mark, index) => {
            let isUnderActiveTrack = null;

            const handleAndGapPercent =
              ((isChanging ? 9 : 10) / sliderWidth) * 100;
            const markPercent = getPourcentFromValue(mark.value);

            if (markPercent <= pourcent - handleAndGapPercent) {
              isUnderActiveTrack = true;
            } else if (markPercent >= pourcent + handleAndGapPercent) {
              isUnderActiveTrack = false;
            }
            return (
              <div
                key={index}
                className={classNames(getClassNames.dot, {
                  'bg-primary-container':
                    isUnderActiveTrack != null && isUnderActiveTrack,
                  'bg-primary':
                    isUnderActiveTrack != null && !isUnderActiveTrack,
                })}
                style={{
                  left: `${getPourcentFromValue(mark.value)}%`,
                }}
              ></div>
            );
          })}
      </div>
    </div>
  );
});
