import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { IconButton, Search } from '../lib/index.js';

expect.extend(toHaveNoViolations);

describe('Search', () => {
  const actionIcon =
    '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>';

  it('renders a named native searchbox and owns an uncontrolled query', () => {
    const onQueryChange = vi.fn();
    render(
      <Search
        label="Search"
        defaultQuery="Material"
        onQueryChange={onQueryChange}
      />,
    );
    const input = screen.getByRole('searchbox', { name: 'Search' });

    expect(input).toHaveValue('Material');
    fireEvent.change(input, { target: { value: 'Material 3' } });

    expect(input).toHaveValue('Material 3');
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith('Material 3');
  });

  it('requests controlled query and expanded changes without local mutation', () => {
    const onQueryChange = vi.fn();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <Search
        label="Search"
        query="initial"
        expanded={false}
        onQueryChange={onQueryChange}
        onExpandedChange={onExpandedChange}
      />,
    );
    const input = screen.getByRole('searchbox', { name: 'Search' });
    fireEvent.change(input, { target: { value: 'next' } });
    rerender(
      <Search
        label="Search"
        query="initial"
        expanded={false}
        onQueryChange={onQueryChange}
        onExpandedChange={onExpandedChange}
      />,
    );
    fireEvent.focus(input);

    expect(input).toHaveValue('initial');
    expect(onQueryChange).toHaveBeenCalledWith('next');
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it('opens on focus, submits with Enter, clears, and closes with Escape', async () => {
    const onExpandedChange = vi.fn();
    const onSearch = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <Search
        label="Search"
        defaultQuery="Material"
        defaultExpanded
        onExpandedChange={onExpandedChange}
        onSearch={onSearch}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );
    const input = screen.getByRole('searchbox', { name: 'Search' });

    expect(input).toHaveValue('Material');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSearch).toHaveBeenCalledWith('Material');

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
    fireEvent.blur(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(input, { key: 'Escape' });
    await waitFor(() =>
      expect(onExpandedChange).toHaveBeenLastCalledWith(false),
    );
  });

  it('renders interactive trailing actions instead of decorative icons', () => {
    const onClick = vi.fn();
    render(
      <Search
        label="Search"
        clearable={false}
        trailingActions={
          <IconButton
            icon={actionIcon}
            label="Open filters"
            tooltip={false}
            onClick={onClick}
          />
        }
      />,
    );

    const action = screen.getByRole('button', { name: 'Open filters' });
    fireEvent.click(action);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(action).toBeVisible();
  });

  it('uses combobox/listbox semantics and shared option focus navigation', async () => {
    render(
      <Search label="Search" defaultExpanded>
        <div role="option" aria-selected={false} tabIndex={-1}>
          Alpha
        </div>
        <div role="option" aria-selected={false} tabIndex={-1}>
          Beta
        </div>
      </Search>,
    );
    const input = screen.getByRole('combobox', { name: 'Search' });
    const options = screen.getAllByRole('option');

    expect(
      screen.getByRole('listbox', { name: 'Search suggestions' }),
    ).toBeVisible();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[0]).toHaveFocus();
    fireEvent.keyDown(options[0], { key: 'ArrowDown' });
    expect(options[1]).toHaveFocus();
    fireEvent.keyDown(options[1], { key: 'Escape' });

    await waitFor(() => expect(input).toHaveFocus());
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not expose an expanded popup while disabled', () => {
    const onExpandedChange = vi.fn();
    render(
      <Search label="Search" disabled onExpandedChange={onExpandedChange} />,
    );
    const input = screen.getByRole('searchbox', { name: 'Search' });

    expect(input).toBeDisabled();
    fireEvent.focus(input);
    expect(onExpandedChange).not.toHaveBeenCalled();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<Search label="Search" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
