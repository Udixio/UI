import { act, fireEvent, render, screen } from '@testing-library/react';
import { animate } from 'motion';
import { Slider } from '../lib/index.js';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// The value-indicator show/hide is a real Motion JS animation owned by
// `createSliderIndicatorController` (core/dom) and already unit-tested
// there; here we only need to verify the React wiring requests the right
// visibility, not exercise jsdom's lack of a real WAAPI implementation.
vi.mock('motion', () => ({ animate: vi.fn(() => ({ stop: vi.fn() })) }));

function stubTrackWidth(track: HTMLElement, width = 200) {
  track.getBoundingClientRect = () =>
    ({ left: 0, width, top: 0, height: 44, right: width, bottom: 44 }) as DOMRect;
}

describe('Slider', () => {
  it('renders with default ARIA attributes', () => {
    render(<Slider name="volume" defaultValue={30} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '30');
    expect(slider).toHaveAttribute('tabindex', '0');
    expect(slider).not.toHaveAttribute('aria-disabled');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Slider name="volume" defaultValue={30} aria-label="Volume" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('owns uncontrolled state and drags to a snapped value', () => {
    const onChange = vi.fn();
    render(<Slider name="volume" defaultValue={0} step={10} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    stubTrackWidth(slider);

    fireEvent.mouseDown(slider, { clientX: 100 });
    expect(slider).toHaveAttribute('aria-valuenow', '50');
    expect(onChange).toHaveBeenLastCalledWith(50);

    fireEvent.mouseMove(window, { clientX: 180 });
    expect(slider).toHaveAttribute('aria-valuenow', '90');

    fireEvent.mouseUp(window);
    onChange.mockClear();
    fireEvent.mouseMove(window, { clientX: 0 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('handles a drag starting at the exact left edge (percent 0)', () => {
    const onChange = vi.fn();
    render(<Slider name="volume" defaultValue={50} step={10} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    stubTrackWidth(slider);

    fireEvent.mouseDown(slider, { clientX: 0 });
    expect(slider).toHaveAttribute('aria-valuenow', '0');
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('does not emit a redundant onChange for a value that does not change', () => {
    const onChange = vi.fn();
    render(<Slider name="volume" defaultValue={50} step={10} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    stubTrackWidth(slider);

    fireEvent.mouseDown(slider, { clientX: 100 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('requests a controlled transition without mutating the controlled value', () => {
    const onChange = vi.fn();
    render(<Slider name="volume" value={20} step={10} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    stubTrackWidth(slider);

    fireEvent.mouseDown(slider, { clientX: 100 });
    expect(onChange).toHaveBeenCalledWith(50);
    // Parent did not feed the new value back in, so the rendered value stays put.
    expect(slider).toHaveAttribute('aria-valuenow', '20');
  });

  it('moves by one step on ArrowRight/ArrowLeft and snaps to bounds on Home/End', () => {
    const onChange = vi.fn();
    render(
      <Slider name="volume" defaultValue={50} step={10} onChange={onChange} />,
    );
    const slider = screen.getByRole('slider');

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider).toHaveAttribute('aria-valuenow', '60');

    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(slider).toHaveAttribute('aria-valuenow', '40');

    fireEvent.keyDown(slider, { key: 'End' });
    expect(slider).toHaveAttribute('aria-valuenow', '100');

    fireEvent.keyDown(slider, { key: 'Home' });
    expect(slider).toHaveAttribute('aria-valuenow', '0');

    expect(onChange).toHaveBeenCalledWith(60);
    expect(onChange).toHaveBeenCalledWith(100);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('shows the value indicator during keyboard use, then hides it after inactivity or blur', () => {
    vi.mocked(animate).mockClear();
    vi.useFakeTimers();
    render(<Slider name="volume" defaultValue={50} step={10} />);
    const slider = screen.getByRole('slider');
    const indicator = slider.querySelector('.handle > div > div') as HTMLElement;

    expect(animate).not.toHaveBeenCalled();

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(animate).toHaveBeenLastCalledWith(
      indicator,
      { scale: 1 },
      { duration: 0.1 },
    );

    act(() => {
      vi.advanceTimersByTime(1499);
    });
    expect(animate).toHaveBeenLastCalledWith(
      indicator,
      { scale: 1 },
      { duration: 0.1 },
    );
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(animate).toHaveBeenLastCalledWith(
      indicator,
      { scale: 0 },
      { duration: 0.1 },
    );

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(animate).toHaveBeenLastCalledWith(
      indicator,
      { scale: 1 },
      { duration: 0.1 },
    );
    fireEvent.blur(slider);
    expect(animate).toHaveBeenLastCalledWith(
      indicator,
      { scale: 0 },
      { duration: 0.1 },
    );

    vi.useRealTimers();
  });

  it('blocks pointer and keyboard interaction while disabled', () => {
    const onChange = vi.fn();
    render(
      <Slider
        name="volume"
        defaultValue={50}
        step={10}
        disabled
        onChange={onChange}
      />,
    );
    const slider = screen.getByRole('slider');
    stubTrackWidth(slider);

    expect(slider).toHaveAttribute('aria-disabled', 'true');
    expect(slider).toHaveAttribute('tabindex', '-1');

    fireEvent.mouseDown(slider, { clientX: 190 });
    fireEvent.keyDown(slider, { key: 'ArrowRight' });

    expect(onChange).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('snaps to the nearest mark when no step is given', () => {
    const onChange = vi.fn();
    render(
      <Slider
        name="percent"
        defaultValue={25}
        onChange={onChange}
        marks={[
          { value: 0, label: '0' },
          { value: 25, label: '25' },
          { value: 50, label: '50' },
          { value: 75, label: '75' },
          { value: 100, label: '100' },
        ]}
      />,
    );
    const slider = screen.getByRole('slider');
    stubTrackWidth(slider);

    fireEvent.mouseDown(slider, { clientX: 130 });
    expect(slider).toHaveAttribute('aria-valuenow', '75');
    expect(onChange).toHaveBeenCalledWith(75);
  });

  it('defaults to a step of 10 when neither step nor marks are given', () => {
    const onChange = vi.fn();
    render(<Slider name="volume" defaultValue={0} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    stubTrackWidth(slider);

    fireEvent.mouseDown(slider, { clientX: 47 });
    expect(slider).toHaveAttribute('aria-valuenow', '20');
  });

  it('exposes the resolved value through a hidden form input', () => {
    render(<Slider name="volume" defaultValue={40} />);
    const input = document.querySelector('input[type="hidden"]');
    expect(input).toHaveAttribute('name', 'volume');
    expect(input).toHaveValue('40');
  });

  it('cleans up pointer listeners on unmount', () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <Slider name="volume" defaultValue={0} step={10} onChange={onChange} />,
    );
    const slider = screen.getByRole('slider');
    stubTrackWidth(slider);

    fireEvent.mouseDown(slider, { clientX: 100 });
    unmount();
    onChange.mockClear();
    fireEvent.mouseMove(window, { clientX: 0 });
    expect(onChange).not.toHaveBeenCalled();
  });
});
