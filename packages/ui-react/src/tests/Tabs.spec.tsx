import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { Tab, TabGroup, TabPanel, TabPanels, Tabs } from '../lib/index.js';

expect.extend(toHaveNoViolations);

describe('Tabs', () => {
  it('owns an uncontrolled selection defaulting to the first tab', () => {
    render(
      <Tabs>
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>,
    );

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('moves the uncontrolled selection on click and notifies once', () => {
    const onSelectedTabChange = vi.fn();
    render(
      <Tabs onSelectedTabChange={onSelectedTabChange}>
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));

    expect(onSelectedTabChange).toHaveBeenCalledTimes(1);
    expect(onSelectedTabChange).toHaveBeenCalledWith(1);
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('requests a controlled change without mutating the rendered selection', () => {
    const onSelectedTabChange = vi.fn();
    render(
      <Tabs selectedTab={0} onSelectedTabChange={onSelectedTabChange}>
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));

    expect(onSelectedTabChange).toHaveBeenCalledWith(1);
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('renders the selection the controlled owner assigns', () => {
    const { rerender } = render(
      <Tabs selectedTab={0}>
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    rerender(
      <Tabs selectedTab={1}>
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('does not select a disabled tab on click', () => {
    const onSelectedTabChange = vi.fn();
    render(
      <Tabs onSelectedTabChange={onSelectedTabChange}>
        <Tab label="One" />
        <Tab label="Two" disabled />
      </Tabs>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));

    expect(onSelectedTabChange).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('exposes the resolved selection to a className function', () => {
    render(
      <Tabs
        selectedTab={1}
        className={({ selectedIndex }) => ({
          tabs: `resolved-${selectedIndex}`,
        })}
      >
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>,
    );

    expect(screen.getByRole('tablist')).toHaveClass('resolved-1');
  });

  it('uses a roving tabIndex with a single stop in the tab order', () => {
    render(
      <Tabs selectedTab={1}>
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>,
    );

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
      'tabIndex',
      '-1',
    );
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute(
      'tabIndex',
      '0',
    );
  });

  it('shows the sliding indicator once a tab is selected, and hides it when none is', () => {
    // Regression test: the indicator controller measures the selected tab
    // through a per-tab ref array that must actually be attached to each
    // rendered Tab. When that wiring is missing, the accessor always
    // resolves to `null` and the controller keeps the indicator at
    // `opacity: 0` forever, silently hiding it instead of failing loudly.
    const { container, rerender } = render(
      <Tabs selectedTab={0}>
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>,
    );

    const indicator = container.querySelector('.indicator') as HTMLElement;
    expect(indicator.style.opacity).toBe('1');

    rerender(
      <Tabs selectedTab={null}>
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>,
    );
    expect(indicator.style.opacity).toBe('0');
  });

  it('measures the icon+label content, not the full tab, for the primary variant', () => {
    // Regression test: the original implementation nested the underline
    // inside the tab's content span and only made that span a positioned
    // ancestor for `primary` (the `secondary` variant's underline escaped
    // to the full tab button). Collapsing both variants onto one
    // full-tab-width measurement silently dropped that distinction.
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function (
      this: HTMLElement,
    ) {
      const width = this.classList.contains('content')
        ? 40
        : this.classList.contains('tab')
          ? 200
          : 0;
      return {
        left: 0,
        top: 0,
        right: width,
        bottom: 0,
        width,
        height: 0,
        x: 0,
        y: 0,
        toJSON() {},
      } as DOMRect;
    };

    try {
      const { container } = render(
        <Tabs selectedTab={0} variant="primary">
          <Tab label="One" />
        </Tabs>,
      );
      const indicator = container.querySelector('.indicator') as HTMLElement;
      expect(indicator.style.width).toBe('40px');
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalRect;
    }
  });

  it('measures the full tab, not just the content, for the secondary variant', () => {
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function (
      this: HTMLElement,
    ) {
      const width = this.classList.contains('content')
        ? 40
        : this.classList.contains('tab')
          ? 200
          : 0;
      return {
        left: 0,
        top: 0,
        right: width,
        bottom: 0,
        width,
        height: 0,
        x: 0,
        y: 0,
        toJSON() {},
      } as DOMRect;
    };

    try {
      const { container } = render(
        <Tabs selectedTab={0} variant="secondary">
          <Tab label="One" />
        </Tabs>,
      );
      const indicator = container.querySelector('.indicator') as HTMLElement;
      expect(indicator.style.width).toBe('200px');
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalRect;
    }
  });

  it('falls back the roving tabIndex to the first enabled tab when nothing is selected', () => {
    render(
      <Tabs selectedTab={null}>
        <Tab label="One" disabled />
        <Tab label="Two" />
      </Tabs>,
    );

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
      'tabIndex',
      '-1',
    );
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute(
      'tabIndex',
      '0',
    );
  });

  it('moves selection with ArrowRight, wrapping and skipping disabled tabs', () => {
    render(
      <Tabs defaultSelectedTab={0}>
        <Tab label="One" />
        <Tab label="Two" disabled />
        <Tab label="Three" />
      </Tabs>,
    );

    fireEvent.keyDown(screen.getByRole('tab', { name: 'One' }), {
      key: 'ArrowRight',
    });
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    // Regression test: moving selection with the keyboard must also move
    // real DOM focus, which requires each Tab's ref to actually be wired.
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: 'Three' }),
    );

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('jumps to the first/last enabled tab on Home/End', () => {
    const onSelectedTabChange = vi.fn();
    render(
      <Tabs selectedTab={1} onSelectedTabChange={onSelectedTabChange}>
        <Tab label="One" />
        <Tab label="Two" />
        <Tab label="Three" />
      </Tabs>,
    );

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'End' });
    expect(onSelectedTabChange).toHaveBeenLastCalledWith(2);

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Home' });
    expect(onSelectedTabChange).toHaveBeenLastCalledWith(0);
  });

  it('renders a link tab as an anchor and a plain tab as a button', () => {
    render(
      <Tabs>
        <Tab label="Docs" href="/docs" />
        <Tab label="Action" />
      </Tabs>,
    );

    expect(screen.getByRole('tab', { name: 'Docs' }).tagName).toBe('A');
    expect(screen.getByRole('tab', { name: 'Action' }).tagName).toBe('BUTTON');
  });

  it('sets aria-disabled and blocks navigation for a disabled link tab, and the native attribute for a disabled button tab', () => {
    render(
      <Tabs>
        <Tab label="Docs" href="/docs" disabled />
        <Tab label="Action" disabled />
      </Tabs>,
    );

    expect(screen.getByRole('tab', { name: 'Docs' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Action' })).toBeDisabled();
  });

  it('does not wire aria-controls without a connected TabPanels', () => {
    render(
      <Tabs selectedTab={0}>
        <Tab label="One" />
      </Tabs>,
    );

    expect(screen.getByRole('tab', { name: 'One' })).not.toHaveAttribute(
      'aria-controls',
    );
  });

  it('has no axe violations for a standalone tab list', async () => {
    const { container } = render(
      <Tabs selectedTab={0}>
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('TabGroup + Tabs + TabPanels', () => {
  it('connects Tabs selection to the matching TabPanel via matching ids', () => {
    render(
      <TabGroup defaultSelectedTab={0}>
        <Tabs>
          <Tab label="One" />
          <Tab label="Two" />
        </Tabs>
        <TabPanels>
          <TabPanel>First content</TabPanel>
          <TabPanel>Second content</TabPanel>
        </TabPanels>
      </TabGroup>,
    );

    const tab = screen.getByRole('tab', { name: 'One' });
    const panel = screen.getByRole('tabpanel');
    expect(screen.getByText('First content')).toBeInTheDocument();
    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });

  it('switches the mounted panel when the tab selection changes', () => {
    render(
      <TabGroup defaultSelectedTab={0}>
        <Tabs>
          <Tab label="One" />
          <Tab label="Two" />
        </Tabs>
        <TabPanels>
          <TabPanel>First content</TabPanel>
          <TabPanel>Second content</TabPanel>
        </TabPanels>
      </TabGroup>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));

    expect(screen.queryByText('First content')).not.toBeInTheDocument();
    expect(screen.getByText('Second content')).toBeInTheDocument();
  });

  it('shares a controlled selection between Tabs and TabPanels', () => {
    const onSelectedTabChange = vi.fn();
    render(
      <TabGroup selectedTab={0} onSelectedTabChange={onSelectedTabChange}>
        <Tabs>
          <Tab label="One" />
          <Tab label="Two" />
        </Tabs>
        <TabPanels>
          <TabPanel>First content</TabPanel>
          <TabPanel>Second content</TabPanel>
        </TabPanels>
      </TabGroup>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));

    expect(onSelectedTabChange).toHaveBeenCalledWith(1);
    // TabGroup is controlled: the owner has not re-rendered with the new
    // value yet, so the first panel is still mounted.
    expect(screen.getByText('First content')).toBeInTheDocument();
  });

  it('warns and renders nothing when TabPanels has no TabGroup ancestor', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <TabPanels>
        <TabPanel>Content</TabPanel>
      </TabPanels>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('has no axe violations for a connected tab list and panel', async () => {
    const { container } = render(
      <TabGroup defaultSelectedTab={0}>
        <Tabs>
          <Tab label="One" />
          <Tab label="Two" />
        </Tabs>
        <TabPanels>
          <TabPanel>First content</TabPanel>
          <TabPanel>Second content</TabPanel>
        </TabPanels>
      </TabGroup>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
