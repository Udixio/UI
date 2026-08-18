import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { useControllableState } from '../lib/utils/use-controllable-state';
import '@testing-library/jest-dom';

function Fixture({
  value,
  defaultValue = false,
  onChange,
}: {
  value?: boolean;
  defaultValue?: boolean;
  onChange?: (value: boolean) => void;
}) {
  const [state, setState] = useControllableState({
    value,
    defaultValue,
    onChange,
    componentName: 'Fixture',
    stateName: 'value',
  });

  return (
    <button onClick={() => setState((current) => !current)}>
      {String(state)}
    </button>
  );
}

describe('useControllableState', () => {
  it('owns and updates an uncontrolled value', () => {
    const onChange = vi.fn();
    render(<Fixture defaultValue onChange={onChange} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('false');
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('requests a controlled update without mutating the rendered value', () => {
    const onChange = vi.fn();
    render(<Fixture value={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('false');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reflects updates made by the controlled owner', () => {
    function Owner() {
      const [value, setValue] = useState(false);
      return <Fixture value={value} onChange={setValue} />;
    }

    render(<Owner />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('true');
  });

  it('only reads defaultValue during initialization', () => {
    const { rerender } = render(<Fixture defaultValue={false} />);
    rerender(<Fixture defaultValue />);

    expect(screen.getByRole('button')).toHaveTextContent('false');
  });
});
