import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { axe } from 'jest-axe';
import { iSearch } from '@udixio/icons-rounded-400/search';
import {
  createMonthTransitionController,
  createTextFieldLabelController,
  createTextareaAutosizeController,
} from '@udixio/core/dom';
import TextField from './TextField.svelte';
import Fixture from './text-field.fixture.svelte';

vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createMonthTransitionController: vi.fn(() => ({ play: vi.fn(), destroy: vi.fn() })),
    createTextFieldLabelController: vi.fn(() => ({ update: vi.fn(), destroy: vi.fn() })),
    createTextareaAutosizeController: vi.fn(() => ({ update: vi.fn(), destroy: vi.fn() })),
    createAnchorPositionerController: vi.fn(() => ({ update: vi.fn(), destroy: vi.fn() })),
  };
});

describe('TextField', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('owns an uncontrolled value and emits each accepted transition once', () => {
    const onChange = vi.fn();
    render(TextField, { props: { label: 'Email', defaultValue: 'a@b.com', onChange } });
    const input = screen.getByLabelText('Email') as HTMLInputElement;

    expect(input).toHaveValue('a@b.com');
    fireEvent.input(input, { target: { value: 'c@d.com' } });
    flushSync();

    expect(input).toHaveValue('c@d.com');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('c@d.com');
  });

  it('requests a controlled change through the bindable Svelte surface', () => {
    const onChange = vi.fn();
    render(TextField, { props: { label: 'Email', value: 'a@b.com', onChange } });
    const input = screen.getByLabelText('Email') as HTMLInputElement;

    fireEvent.input(input, { target: { value: 'c@d.com' } });
    flushSync();

    expect(input).toHaveValue('c@d.com');
    expect(onChange).toHaveBeenCalledWith('c@d.com');
  });

  it('round-trips value through bind: and lets a function binding reject a request', () => {
    const onChange = vi.fn();
    const bound = render(Fixture, {
      props: { label: 'Email', mode: 'bind', initialValue: 'a@b.com', onChange },
    });
    const boundInput = screen.getByLabelText('Email') as HTMLInputElement;
    fireEvent.input(boundInput, { target: { value: 'next@example.com' } });
    flushSync();
    expect(bound.component.readValue()).toBe('next@example.com');
    expect(boundInput).toHaveValue('next@example.com');

    cleanup();
    const rejected = render(Fixture, {
      props: {
        label: 'Email',
        mode: 'function-binding',
        initialValue: 'a@b.com',
        accept: () => false,
        onChange,
      },
    });
    const rejectedInput = screen.getByLabelText('Email') as HTMLInputElement;
    fireEvent.input(rejectedInput, { target: { value: 'rejected@example.com' } });
    flushSync();
    expect(rejected.component.readValue()).toBe('a@b.com');
    expect(rejectedInput).toHaveValue('a@b.com');
    expect(onChange).toHaveBeenLastCalledWith('rejected@example.com');
  });

  it('blocks interaction while disabled', () => {
    const onChange = vi.fn();
    render(TextField, { props: { label: 'Email', disabled: true, onChange } });
    const input = screen.getByLabelText('Email') as HTMLInputElement;

    expect(input).toBeDisabled();
    fireEvent.input(input, { target: { value: 'blocked' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reflects an error via aria-invalid and links the supporting text', () => {
    render(TextField, { props: { label: 'Email', errorText: 'Required' } });
    const input = screen.getByLabelText('Email');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent('Required');
  });

  it('fires onFocus/onBlur exactly once per transition', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(TextField, { props: { label: 'Email', onFocus, onBlur } });
    const input = screen.getByLabelText('Email');

    fireEvent.focus(input);
    fireEvent.focus(input);
    fireEvent.blur(input);
    fireEvent.blur(input);

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('exposes resolved focus and floating state to classes', () => {
    const classes = vi.fn(() => ({}));
    render(TextField, {
      props: { label: 'Email', defaultValue: 'x', classes },
    });

    expect(classes).toHaveBeenLastCalledWith(expect.objectContaining({ isFloating: true, isFocused: false }));
  });

  it('merges the root and element classes and renders icons', () => {
    render(TextField, {
      props: {
        label: 'Search',
        leadingIcon: iSearch,
        class: 'consumer-root',
        classes: { label: 'consumer-label', input: 'consumer-input' },
      },
    });

    expect(screen.getByText('Search', { selector: 'label' })).toHaveClass('consumer-label');
    expect(screen.getByLabelText('Search')).toHaveClass('consumer-input');
    expect(document.querySelector('.text-field')).toHaveClass('consumer-root');
    expect(document.querySelector('.icon svg')).toBeInTheDocument();
  });

  it('aligns an outlined floating label with its legend when a leading icon is present', () => {
    render(TextField, {
      props: {
        label: 'Search',
        variant: 'outlined',
        defaultValue: 'query',
        leadingIcon: '<svg></svg>',
      },
    });

    const label = screen.getByText('Search', { selector: 'label' });
    expect(label).toHaveClass('-left-6');
    expect(label).not.toHaveClass('left-2');
  });

  it('opens a listbox and selects an option', () => {
    const onChange = vi.fn();
    render(TextField, {
      props: {
        label: 'Country',
        type: 'select',
        options: [
          { value: 'fr', label: 'France' },
          { value: 'de', label: 'Germany' },
        ],
        onChange,
      },
    });

    fireEvent.click(screen.getByLabelText('Country'));
    const menu = screen.getByRole('listbox', { name: 'Country' });
    fireEvent.click(within(menu).getByRole('option', { name: 'Germany' }));
    flushSync();

    expect(onChange).toHaveBeenCalledWith('de');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Country')).toHaveValue('Germany');
  });

  it('does not select a disabled option', () => {
    const onChange = vi.fn();
    render(TextField, {
      props: {
        label: 'Country',
        type: 'select',
        options: [{ value: 'de', label: 'Germany', disabled: true }],
        onChange,
      },
    });
    fireEvent.click(screen.getByLabelText('Country'));
    fireEvent.click(screen.getByRole('option', { name: 'Germany' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('opens and cancels the date picker without committing a value', () => {
    const onChange = vi.fn();
    render(TextField, { props: { label: 'Birthday', type: 'date', onChange } });

    fireEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('stays typable in date mode and applies the built-in mask', () => {
    const onChange = vi.fn();
    render(TextField, { props: { label: 'Birthday', type: 'date', onChange } });
    const input = screen.getByLabelText('Birthday') as HTMLInputElement;

    expect(input).not.toHaveAttribute('readonly');
    for (const digit of '20260807') {
      fireEvent.input(input, { target: { value: input.value + digit } });
    }
    flushSync();

    expect(input).toHaveValue('2026-08-07');
    expect(onChange).toHaveBeenLastCalledWith('2026-08-07');
  });

  it('rejects non-date characters and accepts a custom mask', () => {
    const onChange = vi.fn();
    render(TextField, { props: { label: 'Birthday', type: 'date', onChange } });
    const input = screen.getByLabelText('Birthday') as HTMLInputElement;

    fireEvent.input(input, { target: { value: 'hello 2026-08-07 world' } });
    expect(input).toHaveValue('2026-08-07');

    cleanup();
    const digitsOnly = (raw: string) => raw.replace(/\D/g, '').slice(0, 4);
    render(TextField, {
      props: { label: 'Birthday', type: 'date', mask: digitsOnly, onChange },
    });
    const maskedInput = screen.getByLabelText('Birthday') as HTMLInputElement;
    fireEvent.input(maskedInput, { target: { value: '2026-08-07' } });
    expect(maskedInput).toHaveValue('2026');
    expect(onChange).toHaveBeenLastCalledWith('2026');
  });

  it('commits a selected calendar day on OK', () => {
    const onChange = vi.fn();
    render(TextField, { props: { label: 'Birthday', type: 'date', onChange } });
    fireEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    const today = new Date().getDate().toString();
    const day = Array.from(screen.getByRole('grid').querySelectorAll('button[data-date]'))
      .find((button) => button.textContent?.trim() === today) as HTMLButtonElement;
    fireEvent.click(day);
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText('Birthday') as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('supports the shared calendar year view and month transition controller', () => {
    const transition = { play: vi.fn(), destroy: vi.fn() };
    vi.mocked(createMonthTransitionController).mockReturnValue(transition);
    render(TextField, { props: { label: 'Birthday', type: 'date' } });

    fireEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    flushSync();
    expect(createMonthTransitionController).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    flushSync();
    expect(transition.play).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: 'Choose year' }));
    flushSync();
    expect(screen.getByRole('button', { name: String(new Date().getFullYear()), exact: true })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: String(new Date().getFullYear()), exact: true }));
    flushSync();
    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();
    expect(grid.querySelector('[tabindex="0"]')).toBeInTheDocument();
  });

  it('creates and cleans up the shared label and textarea autosize controllers', () => {
    const labelController = { update: vi.fn(), destroy: vi.fn() };
    const autosizeController = { update: vi.fn(), destroy: vi.fn() };
    vi.mocked(createTextFieldLabelController).mockReturnValue(labelController);
    vi.mocked(createTextareaAutosizeController).mockReturnValue(autosizeController);
    const { unmount } = render(TextField, {
      props: { label: 'Notes', multiline: true, defaultValue: 'Hello' },
    });

    expect(createTextFieldLabelController).toHaveBeenCalledTimes(1);
    expect(createTextareaAutosizeController).toHaveBeenCalledTimes(1);
    expect(autosizeController.update).toHaveBeenCalled();
    unmount();
    expect(labelController.destroy).toHaveBeenCalledTimes(1);
    expect(autosizeController.destroy).toHaveBeenCalledTimes(1);
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(TextField, {
      props: { label: 'Email', supportingText: 'We never share this' },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
