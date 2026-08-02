import {
  classNames,
  getSliderKeyboardTransition,
  getSliderPercentFromValue,
  SLIDER_KEYBOARD_INDICATOR_TIMEOUT_MS,
  type ReactProps,
  type SliderInterface,
  sliderStyle,
} from '@udixio/core';
import {
  createSliderIndicatorController,
  createSliderPointerController,
  type SliderIndicatorController,
  type SliderPointerController,
} from '@udixio/core/dom';
import { useEffect, useRef, useState } from 'react';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';

export type ReactSliderProps = ReactProps<SliderInterface>;

export const useSliderStyle = createUseStyle(sliderStyle);

/**
 * Sliders let users make selections from a range of values.
 * @status beta
 * @category Input
 * @devx
 * - `value`/`onChange` are controlled; use `defaultValue` for uncontrolled usage. Choose one mode for the component's lifetime.
 * - `onChange` receives the numeric value (not the DOM event) and fires once per accepted transition.
 * - Use `-Infinity`/`Infinity` on `min`/`max`, with a matching `marks` entry, for an open-ended range.
 * @a11y
 * - Renders `role="slider"` with `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext`.
 * - Focusable and responds to ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Home/End; `disabled` removes it from the tab order.
 * - Provide `aria-label` or `aria-labelledby`; this component does not render label text.
 * @limitations
 * - Single-thumb only; there is no dual-thumb range-selection mode.
 * - Horizontal orientation only.
 */
export const Slider = ({
  className,
  valueFormatter,
  step,
  name,
  value,
  defaultValue = 0,
  disabled = false,
  min = 0,
  max = 100,
  marks,
  ref: optionalRef,
  onChange,
  ...restProps
}: ReactSliderProps) => {
  // A discrete step is the default only when the caller didn't opt into
  // mark-based snapping instead; explicit `marks` without `step` snaps to
  // those marks, matching the mental model "marks replace the default step".
  const resolvedStep = step ?? (marks ? undefined : 10);
  const resolvedMarks =
    marks ?? [
      {
        value: min === -Infinity ? 0 : min,
        label: String(min === -Infinity ? 0 : min),
      },
      {
        value: max === Infinity ? 100 : max,
        label: String(max === Infinity ? 100 : max),
      },
    ];

  // Tracked separately so a keyboard-driven hide-timeout can never cut off
  // an in-progress drag, and vice versa.
  const [isDragging, setIsDragging] = useState(false);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const isChanging = isDragging || isKeyboardActive;
  const keyboardIndicatorTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  useEffect(() => {
    return () => clearTimeout(keyboardIndicatorTimeoutRef.current);
  }, []);

  const defaultRef = useRef<HTMLDivElement>(null);
  const ref = optionalRef || defaultRef;

  const [resolvedValue, setValue] = useControllableState({
    value,
    defaultValue,
    onChange,
    componentName: 'Slider',
    stateName: 'value',
  });

  const percent = getSliderPercentFromValue(resolvedValue, {
    min,
    max,
    marks: resolvedMarks,
  });

  // Kept live for the pointer controller and the keydown handler, which are
  // wired once and must never read a stale min/max/step/marks/disabled.
  const liveRef = useRef({
    min,
    max,
    step: resolvedStep,
    marks: resolvedMarks,
    disabled,
    setValue,
  });
  liveRef.current = {
    min,
    max,
    step: resolvedStep,
    marks: resolvedMarks,
    disabled,
    setValue,
  };

  useEffect(() => {
    const track = ref.current;
    if (!track) return;

    const controller: SliderPointerController = createSliderPointerController(
      {
        track,
        min: () => liveRef.current.min,
        max: () => liveRef.current.max,
        step: () => liveRef.current.step,
        marks: () => liveRef.current.marks,
        disabled: () => liveRef.current.disabled,
        onValueChange: (next) => liveRef.current.setValue(next),
        onDraggingChange: setIsDragging,
      },
    );

    return () => controller.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const indicatorRef = useRef<HTMLDivElement>(null);
  const indicatorControllerRef = useRef<SliderIndicatorController>(undefined);

  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;
    const controller = createSliderIndicatorController({ indicator });
    indicatorControllerRef.current = controller;
    return () => {
      controller.destroy();
      indicatorControllerRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    indicatorControllerRef.current?.setVisible(isChanging);
  }, [isChanging]);

  const [sliderWidth, setSliderWidth] = useState(0);
  useEffect(() => {
    const track = ref.current;
    if (!track) return;
    const updateSliderWidth = () => setSliderWidth(track.offsetWidth);
    updateSliderWidth();
    window.addEventListener('resize', updateSliderWidth);
    return () => window.removeEventListener('resize', updateSliderWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const styles = useSliderStyle({
    className,
    disabled,
    isChanging,
    marks,
    max,
    min,
    name,
    step,
    value,
    defaultValue,
    valueFormatter,
    onChange,
  });

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const transition = getSliderKeyboardTransition({
      key: event.key,
      value: resolvedValue,
      min,
      max,
      step: resolvedStep,
      marks: resolvedMarks,
      disabled,
    });
    if (transition.blocked) return;
    event.preventDefault();
    setValue(transition.nextValue);

    setIsKeyboardActive(true);
    clearTimeout(keyboardIndicatorTimeoutRef.current);
    keyboardIndicatorTimeoutRef.current = setTimeout(
      () => setIsKeyboardActive(false),
      SLIDER_KEYBOARD_INDICATOR_TIMEOUT_MS,
    );
  };

  const handleBlur = () => {
    clearTimeout(keyboardIndicatorTimeoutRef.current);
    setIsKeyboardActive(false);
  };

  return (
    <div
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      role="slider"
      aria-valuemin={min === -Infinity ? undefined : min}
      aria-valuemax={max === Infinity ? undefined : max}
      aria-valuenow={resolvedValue}
      aria-valuetext={resolvedValue.toString()}
      aria-disabled={disabled || undefined}
      className={styles.slider}
      ref={ref}
      {...restProps}
    >
      <input
        type="hidden"
        name={name}
        value={resolvedValue}
        disabled={disabled}
      />
      <div
        className={styles.activeTrack}
        style={{ flex: percent / 100 }}
      ></div>
      <div className={styles.handle}>
        <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 transform">
          <div
            ref={indicatorRef}
            className={styles.valueIndicator}
            style={{ transform: 'scale(0)' }}
          >
            {valueFormatter ? valueFormatter(resolvedValue) : resolvedValue}
          </div>
        </div>
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
        {resolvedMarks.map((mark, index) => {
          let isUnderActiveTrack = null;

          const handleAndGapPercent = ((isChanging ? 9 : 10) / sliderWidth) * 100;
          const markPercent = getSliderPercentFromValue(mark.value, {
            min,
            max,
            marks: resolvedMarks,
          });

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
                'bg-primary': isUnderActiveTrack != null && !isUnderActiveTrack,
              })}
              style={{
                left: `${markPercent}%`,
              }}
            ></div>
          );
        })}
      </div>
    </div>
  );
};
