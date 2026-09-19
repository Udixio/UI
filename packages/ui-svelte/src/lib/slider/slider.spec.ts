import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { axe } from 'jest-axe';
import { createSliderIndicatorController } from '@udixio/core/dom';
import Slider from './Slider.svelte';
import Fixture from './slider.fixture.svelte';

vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createSliderIndicatorController: vi.fn(() => ({
      setVisible: vi.fn(),
      destroy: vi.fn(),
    })),
  };
});

function stubTrack(track: HTMLElement, width = 200) {
  track.getBoundingClientRect = () =>
    ({ left: 0, width, top: 0, height: 44, right: width, bottom: 44 }) as DOMRect;
  Object.defineProperty(track, 'offsetWidth', { value: width, configurable: true });
  window.dispatchEvent(new Event('resize'));
}

describe('Slider', () => {
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders default ARIA attributes and keyboard focus', () => {
    render(Slider, { props: { name: 'volume', defaultValue: 30 } });
    const slider = screen.getByRole('slider');

    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '30');
    expect(slider).toHaveAttribute('aria-valuetext', '30');
    expect(slider).toHaveAttribute('tabindex', '0');
    expect(slider).not.toHaveAttribute('aria-disabled');
  });

  it('uses valueFormatter for aria-valuetext and the value indicator', () => {
    render(Slider, {
      props: {
        defaultValue: 30,
        valueFormatter: (value) => `${value}%`,
        'aria-label': 'Volume',
      },
    });
    const slider = screen.getByRole('slider', { name: 'Volume' });

    expect(slider).toHaveAttribute('aria-valuetext', '30%');
    expect(slider.querySelector('.value-indicator')).toHaveTextContent('30%');
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(Slider, {
      props: { defaultValue: 30, 'aria-label': 'Volume' },
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('owns uncontrolled state and drags to a snapped value', () => {
    const onChange = vi.fn();
    render(Slider, {
      props: { defaultValue: 0, step: 10, onChange, 'aria-label': 'Volume' },
    });
    const slider = screen.getByRole('slider', { name: 'Volume' });
    stubTrack(slider);

    fireEvent.mouseDown(slider, { clientX: 100 });
    flushSync();
    expect(slider).toHaveAttribute('aria-valuenow', '50');
    expect(onChange).toHaveBeenLastCalledWith(50);

    fireEvent.mouseMove(window, { clientX: 180 });
    flushSync();
    expect(slider).toHaveAttribute('aria-valuenow', '90');

    fireEvent.mouseUp(window);
    onChange.mockClear();
    fireEvent.mouseMove(window, { clientX: 0 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('handles a drag starting at the exact left edge', () => {
    const onChange = vi.fn();
    render(Slider, {
      props: { defaultValue: 50, step: 10, onChange, 'aria-label': 'Volume' },
    });
    const slider = screen.getByRole('slider', { name: 'Volume' });
    stubTrack(slider);

    fireEvent.mouseDown(slider, { clientX: 0 });
    flushSync();
    expect(slider).toHaveAttribute('aria-valuenow', '0');
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('does not emit a redundant change for the current value', () => {
    const onChange = vi.fn();
    render(Slider, {
      props: { defaultValue: 50, step: 10, onChange, 'aria-label': 'Volume' },
    });
    const slider = screen.getByRole('slider', { name: 'Volume' });
    stubTrack(slider);

    fireEvent.mouseDown(slider, { clientX: 100 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('requests controlled pointer changes without mutating the value', () => {
    const onChange = vi.fn();
    render(Slider, {
      props: { value: 20, step: 10, onChange, 'aria-label': 'Volume' },
    });
    const slider = screen.getByRole('slider', { name: 'Volume' });
    stubTrack(slider);

    fireEvent.mouseDown(slider, { clientX: 100 });
    flushSync();
    expect(onChange).toHaveBeenCalledWith(50);
  });

  it('moves by step and snaps to bounds with the keyboard', () => {
    const onChange = vi.fn();
    render(Slider, {
      props: { defaultValue: 50, step: 10, onChange, 'aria-label': 'Volume' },
    });
    const slider = screen.getByRole('slider', { name: 'Volume' });

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    flushSync();
    expect(slider).toHaveAttribute('aria-valuenow', '60');
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    flushSync();
    expect(slider).toHaveAttribute('aria-valuenow', '40');
    fireEvent.keyDown(slider, { key: 'End' });
    fireEvent.keyDown(slider, { key: 'Home' });
    flushSync();
    expect(slider).toHaveAttribute('aria-valuenow', '0');
    expect(onChange).toHaveBeenCalledWith(60);
    expect(onChange).toHaveBeenCalledWith(100);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('shows the value indicator during keyboard use and hides it after inactivity or blur', () => {
    vi.useFakeTimers();
    const controller = { setVisible: vi.fn(), destroy: vi.fn() };
    vi.mocked(createSliderIndicatorController).mockReturnValue(controller as never);
    render(Slider, { props: { defaultValue: 50, step: 10, 'aria-label': 'Volume' } });
    const slider = screen.getByRole('slider', { name: 'Volume' });

    expect(controller.setVisible).toHaveBeenCalledWith(false);
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    flushSync();
    expect(controller.setVisible).toHaveBeenLastCalledWith(true);

    vi.advanceTimersByTime(1499);
    flushSync();
    expect(controller.setVisible).toHaveBeenLastCalledWith(true);
    vi.advanceTimersByTime(1);
    flushSync();
    expect(controller.setVisible).toHaveBeenLastCalledWith(false);

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    flushSync();
    fireEvent.blur(slider);
    flushSync();
    expect(controller.setVisible).toHaveBeenLastCalledWith(false);
    expect(controller.destroy).not.toHaveBeenCalled();
  });

  it('blocks pointer and keyboard interaction while disabled', () => {
    const onChange = vi.fn();
    render(Slider, {
      props: {
        defaultValue: 50,
        step: 10,
        disabled: true,
        onChange,
        'aria-label': 'Volume',
      },
    });
    const slider = screen.getByRole('slider', { name: 'Volume' });
    stubTrack(slider);

    expect(slider).toHaveAttribute('aria-disabled', 'true');
    expect(slider).toHaveAttribute('tabindex', '-1');
    fireEvent.mouseDown(slider, { clientX: 190 });
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('snaps to marks when no step is provided and defaults to step ten otherwise', () => {
    const onChange = vi.fn();
    render(Slider, {
      props: {
        defaultValue: 25,
        marks: [
          { value: 0, label: '0' },
          { value: 25, label: '25' },
          { value: 50, label: '50' },
          { value: 75, label: '75' },
          { value: 100, label: '100' },
        ],
        onChange,
        'aria-label': 'Percent',
      },
    });
    const markedSlider = screen.getByRole('slider', { name: 'Percent' });
    stubTrack(markedSlider);
    fireEvent.mouseDown(markedSlider, { clientX: 130 });
    flushSync();
    expect(markedSlider).toHaveAttribute('aria-valuenow', '75');

    cleanup();
    render(Slider, {
      props: { defaultValue: 0, onChange, 'aria-label': 'Volume' },
    });
    const steppedSlider = screen.getByRole('slider', { name: 'Volume' });
    stubTrack(steppedSlider);
    fireEvent.mouseDown(steppedSlider, { clientX: 47 });
    flushSync();
    expect(steppedSlider).toHaveAttribute('aria-valuenow', '20');
  });

  it('round-trips value through bind: and lets function binding reject a request', async () => {
    const onChange = vi.fn();
    const bound = render(Fixture, {
      props: { mode: 'bind', initialValue: 20, onChange, 'aria-label': 'Volume' },
    });
    const boundSlider = screen.getByRole('slider', { name: 'Volume' });
    stubTrack(boundSlider);
    fireEvent.keyDown(boundSlider, { key: 'ArrowRight' });
    flushSync();
    expect(bound.component.readValue()).toBe(30);
    expect(boundSlider).toHaveAttribute('aria-valuenow', '30');

    cleanup();
    const rejected = render(Fixture, {
      props: {
        mode: 'function-binding',
        initialValue: 20,
        accept: () => false,
        onChange,
        'aria-label': 'Volume',
      },
    });
    const rejectedSlider = screen.getByRole('slider', { name: 'Volume' });
    fireEvent.keyDown(rejectedSlider, { key: 'ArrowRight' });
    flushSync();
    expect(rejected.component.readValue()).toBe(20);
    expect(rejectedSlider).toHaveAttribute('aria-valuenow', '20');
    expect(onChange).toHaveBeenLastCalledWith(30);
  });

  it('exposes the resolved value through a hidden form input and forwards classes', () => {
    const classes = vi.fn(() => ({ slider: 'consumer-slider' }));
    render(Slider, {
      props: {
        name: 'volume',
        defaultValue: 40,
        class: 'consumer-root',
        classes,
        'data-testid': 'slider',
        'aria-label': 'Volume',
      },
    });

    const slider = screen.getByTestId('slider');
    expect(slider).toHaveClass('consumer-root', 'consumer-slider');
    expect(slider.querySelector('input[type="hidden"]')).toHaveValue('40');
    expect(slider.querySelector('input[type="hidden"]')).toHaveAttribute('name', 'volume');
    expect(classes).toHaveBeenCalledWith(expect.objectContaining({ isChanging: false }));
  });

  it('cleans up pointer listeners on unmount', () => {
    const onChange = vi.fn();
    const { unmount } = render(Slider, {
      props: { defaultValue: 0, step: 10, onChange, 'aria-label': 'Volume' },
    });
    const slider = screen.getByRole('slider', { name: 'Volume' });
    stubTrack(slider);
    fireEvent.mouseDown(slider, { clientX: 100 });
    unmount();
    onChange.mockClear();
    fireEvent.mouseMove(window, { clientX: 0 });
    expect(onChange).not.toHaveBeenCalled();
  });
});
