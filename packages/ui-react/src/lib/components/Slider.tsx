import { AnimatePresence, motion } from 'motion/react';
import { SliderInterface } from '../interfaces';
import { sliderStyle } from '../styles';
import { classNames, ReactProps } from '../utils';
import { useEffect, useRef, useState } from 'react';

/**
 * Sliders let users make selections from a range of values
 * @status beta
 * @category Input
 */
export const Slider = ({
  className,
  valueFormatter,
  step = 10,
  name,
  value: defaultValue = 0,
  min = 0,
  max = 100,
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
  ref,
  onChange,
  ...restProps
}: ReactProps<SliderInterface>) => {
  const getpercentFromValue = (value: number) => {
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
      return max;
    }
    return max == Infinity ? marks[marks?.length - 1].value : max;
  };
  const getMin = (isInfinity = false) => {
    if (isInfinity) {
      return min;
    }
    return min == -Infinity ? marks[0].value : min;
  };

  const getValueFrompercent = (percent: number) => {
    const min = getMin(false);
    const max = getMax(false);
    return ((max - min) * percent) / 100 + min;
  };

  const [isChanging, setIsChanging] = useState(false);
  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef: React.RefObject<any> | React.ForwardedRef<any> =
    ref || defaultRef;

  const [value, setValue] = useState(defaultValue);
  const [percent, setpercent] = useState(getpercentFromValue(defaultValue));
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

  const styles = sliderStyle({
    className,
    isChanging,
    marks,
    max,
    min,
    name,
    step,
    value,
    valueFormatter,
    onChange,
  });
  const handleChange = (event: any) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const current = resolvedRef?.current;
    if (current) {
      const refPosition = current.getBoundingClientRect().left;

      const clientX =
        event.type === 'touchmove' || event.type === 'touchstart'
          ? event.touches[0].clientX
          : event.clientX;

      const percent = ((clientX - refPosition) / current.offsetWidth) * 100;

      updateSliderValues({ percent });
    }
  };
  const updateSliderValues = ({
    percent,
    value,
  }: {
    percent?: number;
    value?: number;
  }) => {
    if (percent) {
      if (percent >= 100) {
        setValue(getMax(true));
        setpercent(100);
        return;
      }
      if (percent <= 0) {
        setValue(getMin(true));
        setpercent(0);
        return;
      }

      value = getValueFrompercent(percent);
      if (value == getMin()) {
        value = getMin(true);
      }
      if (value == getMax()) {
        value = getMax(true);
      }
    } else if (value != undefined) {
      if (value >= getMax()) {
        setValue(getMax(true));
        setpercent(100);
        return;
      }
      if (value <= getMin()) {
        setValue(getMin(true));
        setpercent(0);
        return;
      }
      percent = getpercentFromValue(value);
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

    percent = getpercentFromValue(value);

    setValue(value);
    setpercent(percent);
    if (onChange) {
      onChange(value);
    }
  };
  const [sliderWidth, setSliderWidth] = useState(0);
  useEffect(() => {
    const updateSliderWidth = () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (resolvedRef.current) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
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
            .find((mark, index, array) => {
              if (value === Infinity) {
                // If value is Infinity, take the second-to-last mark
                return index === 1;
              }
              return mark.value < value;
            });

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
      className={styles.slider}
      onMouseDown={handleMouseDown}
      onClick={handleChange}
      ref={resolvedRef}
      onTouchStart={handleMouseDown}
      onDragStart={(e) => e.preventDefault()}
      {...restProps}
    >
      <input type="hidden" name={name} value={value} />
      <div className={styles.activeTrack} style={{ flex: percent / 100 }}></div>
      <div className={styles.handle}>
        <AnimatePresence>
          {isChanging && (
            <motion.div
              className={styles.valueIndicator}
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
              {valueFormatter ? valueFormatter(value) : value}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div
        className={styles.inactiveTrack}
        style={{ flex: 1 - percent / 100 }}
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
            const markPercent = getpercentFromValue(mark.value);

            if (markPercent <= percent - handleAndGapPercent) {
              isUnderActiveTrack = true;
            } else if (markPercent >= percent + handleAndGapPercent) {
              isUnderActiveTrack = false;
            }
            return (
              <div
                key={index}
                className={classNames(styles.dot, {
                  'bg-primary-container':
                    isUnderActiveTrack != null && isUnderActiveTrack,
                  'bg-primary':
                    isUnderActiveTrack != null && !isUnderActiveTrack,
                })}
                style={{
                  left: `${getpercentFromValue(mark.value)}%`,
                }}
              ></div>
            );
          })}
      </div>
    </div>
  );
};
