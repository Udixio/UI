import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { beforeAll, beforeEach, vi } from 'vitest';
import { MenuItem, TextField } from '../lib/index.js';
import {
  createTextFieldLabelController,
  createTextareaAutosizeController,
} from '@udixio/core/dom';

expect.extend(toHaveNoViolations);

// jsdom lacks ResizeObserver; the date/select popover's AnchorPositioner needs it to mount.
beforeAll(() => {
  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.assign(globalThis, {
    ResizeObserver: (globalThis as any).ResizeObserver ?? NoopObserver,
  });
});

// Mocking `animejs` directly (a transitive dependency of `@udixio/core/dom`)
// corrupts the sibling `@udixio/core` entry's exports under Vite's
// dependency pre-bundling in this workspace -- mocking the already-isolated
// controller factories instead avoids that (see Switch.spec.tsx).
vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createTextFieldLabelController: vi.fn(),
    createTextareaAutosizeController: vi.fn(),
  };
});

function mockController() {
  return { update: vi.fn(), destroy: vi.fn() };
}

describe('TextField', () => {
  beforeEach(() => {
    vi.mocked(createTextFieldLabelController).mockReturnValue(mockController());
    vi.mocked(createTextareaAutosizeController).mockReturnValue(
      mockController(),
    );
  });

  it('owns an uncontrolled value and emits each accepted transition once', () => {
    const onChange = vi.fn();
    render(
      <TextField label="Email" defaultValue="a@b.com" onChange={onChange} />,
    );
    const input = screen.getByLabelText('Email') as HTMLInputElement;

    expect(input.value).toBe('a@b.com');
    fireEvent.change(input, { target: { value: 'c@d.com' } });
    expect(input.value).toBe('c@d.com');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('c@d.com');
  });

  it('requests a controlled change without mutating the rendered value', () => {
    const onChange = vi.fn();
    render(<TextField label="Email" value="a@b.com" onChange={onChange} />);
    const input = screen.getByLabelText('Email') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'c@d.com' } });
    expect(input.value).toBe('a@b.com');
    expect(onChange).toHaveBeenCalledWith('c@d.com');
  });

  it('blocks interaction while disabled', () => {
    const onChange = vi.fn();
    render(<TextField label="Email" disabled onChange={onChange} />);
    const input = screen.getByLabelText('Email') as HTMLInputElement;

    expect(input).toBeDisabled();
  });

  it('reflects an error via aria-invalid and links the supporting text', () => {
    render(<TextField label="Email" errorText="Required" />);
    const input = screen.getByLabelText('Email');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
    const describedBy = input.getAttribute('aria-describedby');
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      'Required',
    );
  });

  it('fires onFocus/onBlur exactly once per transition', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(<TextField label="Email" onFocus={onFocus} onBlur={onBlur} />);
    const input = screen.getByLabelText('Email');

    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('exposes isFloating/isFocused to a className function', () => {
    const className = vi.fn().mockReturnValue({});
    render(<TextField label="Email" defaultValue="x" className={className} />);

    const lastCall = className.mock.calls.at(-1)?.[0];
    expect(lastCall).toMatchObject({ isFloating: true, isFocused: false });
  });

  it('aligns an outlined floating label with its legend when a leading icon is present', () => {
    render(
      <TextField
        label="Search"
        variant="outlined"
        defaultValue="query"
        leadingIcon="<svg></svg>"
      />,
    );

    const label = screen.getByText('Search', { selector: 'label' });
    expect(label).toHaveClass('-left-6');
    expect(label).not.toHaveClass('left-2');
  });

  it('opens a menu of options and selects one', () => {
    const onChange = vi.fn();
    render(
      <TextField
        label="Country"
        type="select"
        options={[
          { value: 'fr', label: 'France' },
          { value: 'de', label: 'Germany' },
        ]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('Country'));
    const menu = screen.getByRole('listbox', { name: 'Country' });
    fireEvent.click(within(menu).getByText('Germany'));

    expect(onChange).toHaveBeenCalledWith('de');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selects from projected MenuItem children like it does from options', () => {
    const onChange = vi.fn();
    render(
      <TextField
        label="Country"
        type="select"
        defaultValue="fr"
        onChange={onChange}
      >
        <MenuItem label="France" value="fr" />
        <MenuItem label="Germany" value="de" />
      </TextField>,
    );

    const input = screen.getByLabelText('Country');
    expect(input).toHaveValue('France');

    fireEvent.click(input);
    const menu = screen.getByRole('listbox', { name: 'Country' });
    fireEvent.click(within(menu).getByText('Germany'));

    expect(onChange).toHaveBeenCalledWith('de');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    // The field shows the item's label, not the raw value -- like `options` does.
    expect(input).toHaveValue('Germany');
  });

  it('opens a date picker and confirms a selection', () => {
    const onChange = vi.fn();
    render(<TextField label="Birthday" type="date" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(
      screen.queryByRole('button', { name: 'OK' }),
    ).not.toBeInTheDocument();
  });

  it('stays directly typable in date mode -- only select mode is read-only', () => {
    const onChange = vi.fn();
    render(<TextField label="Birthday" type="date" onChange={onChange} />);
    const input = screen.getByLabelText('Birthday') as HTMLInputElement;

    expect(input).not.toHaveAttribute('readonly');
    fireEvent.change(input, { target: { value: '2026-08-07' } });
    expect(onChange).toHaveBeenCalledWith('2026-08-07');
  });

  it('rejects non-date characters typed or pasted into a date field', () => {
    const onChange = vi.fn();
    render(
      <TextField
        label="Birthday"
        type="date"
        defaultValue="2026-01-01"
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText('Birthday') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'egrrg' } });
    expect(input.value).toBe('');
    expect(onChange).toHaveBeenCalledWith('');

    fireEvent.change(input, { target: { value: 'hello 2026-08-07 world' } });
    expect(input.value).toBe('2026-08-07');
    expect(onChange).toHaveBeenLastCalledWith('2026-08-07');
  });

  it('auto-inserts dashes as the user types digits in sequence', () => {
    const onChange = vi.fn();
    render(<TextField label="Birthday" type="date" onChange={onChange} />);
    const input = screen.getByLabelText('Birthday') as HTMLInputElement;

    for (const digit of '20260807') {
      fireEvent.change(input, { target: { value: input.value + digit } });
    }

    expect(input.value).toBe('2026-08-07');
    expect(onChange).toHaveBeenLastCalledWith('2026-08-07');
  });

  it('lets a custom mask override the built-in date mask', () => {
    const onChange = vi.fn();
    const digitsOnly = (raw: string) => raw.replace(/\D/g, '').slice(0, 4);
    render(
      <TextField
        label="Birthday"
        type="date"
        mask={digitsOnly}
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText('Birthday') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '2026-08-07' } });
    expect(input.value).toBe('2026');
    expect(onChange).toHaveBeenLastCalledWith('2026');
  });

  // Idempotent: strips its own literal prefix before extracting digits, so
  // re-running it on its own prior output (as the component does on every
  // keystroke) doesn't re-count "33" as user-entered digits.
  const phoneMask = (raw: string) => {
    const digits = raw.replace(/^\+33/, '').replace(/\D/g, '').slice(0, 9);
    return digits ? `+33${digits}` : '';
  };

  it('applies a custom mask to a non-date field', () => {
    const onChange = vi.fn();
    render(<TextField label="Phone" mask={phoneMask} onChange={onChange} />);
    const input = screen.getByLabelText('Phone') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'abc612345678xyz' } });
    expect(input.value).toBe('+33612345678');
    expect(onChange).toHaveBeenLastCalledWith('+33612345678');
  });

  it('stays stable through incremental typing and backspacing on a prefix-style custom mask', () => {
    const onChange = vi.fn();
    render(<TextField label="Phone" mask={phoneMask} onChange={onChange} />);
    const input = screen.getByLabelText('Phone') as HTMLInputElement;

    for (const digit of '612345678') {
      fireEvent.change(input, { target: { value: input.value + digit } });
    }
    expect(input.value).toBe('+33612345678');

    fireEvent.change(input, {
      target: { value: input.value.slice(0, -1) },
    });
    expect(input.value).toBe('+3361234567');

    fireEvent.change(input, {
      target: { value: input.value.slice(0, -1) },
    });
    expect(input.value).toBe('+336123456');
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <TextField label="Email" supportingText="We never share this" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
