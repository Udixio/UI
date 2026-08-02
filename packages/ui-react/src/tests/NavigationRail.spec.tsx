import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import {
  NavigationRail,
  NavigationRailItem,
  NavigationRailSection,
} from '../lib/index.js';

expect.extend(toHaveNoViolations);

const iAlarm = 'M0 0h24v24H0z';

describe('NavigationRail', () => {
  it('owns an uncontrolled extended state and emits each accepted transition once', () => {
    const onExtendedChange = vi.fn();
    render(
      <NavigationRail defaultExtended={false} onExtendedChange={onExtendedChange}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
      </NavigationRail>,
    );

    const toggle = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(toggle);

    expect(onExtendedChange).toHaveBeenCalledTimes(1);
    expect(onExtendedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
  });

  it('requests controlled extended changes without mutating the rendered value', () => {
    const onExtendedChange = vi.fn();
    render(
      <NavigationRail extended={false} onExtendedChange={onExtendedChange}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
      </NavigationRail>,
    );

    const toggle = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(toggle);

    expect(onExtendedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  });

  it('updates the rendered extended state when the controlled owner changes it', () => {
    const { rerender } = render(
      <NavigationRail extended={false}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
      </NavigationRail>,
    );
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();

    rerender(
      <NavigationRail extended={true}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
      </NavigationRail>,
    );
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
  });

  it('renders footer content pinned below the segments', () => {
    render(
      <NavigationRail footer={<button>Sign out</button>}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
      </NavigationRail>,
    );

    expect(
      screen.getByRole('button', { name: 'Sign out' }),
    ).toBeInTheDocument();
  });

  it('gives every segment a unique React key, even when an item-only counter collides with a section position', () => {
    // Regression test: with 4 items before the section and 3 after it, the
    // section used to be cloned with `key = its raw array position` (4)
    // while items were cloned with `key = an item-only counter` that also
    // reaches 4 for the 5th item ("Schedule"). Two siblings sharing a key
    // is exactly what React warns can duplicate or drop children on the next
    // reconciliation -- which is what surfaced as the "Sleep well" section
    // label duplicating after clicking a button.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NavigationRail defaultExtended={true}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Clock" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Timer" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Stopwatch" />
        <NavigationRailSection label="Sleep well" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Schedule" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Stats" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Sleep sound" />
      </NavigationRail>,
    );

    expect(
      errorSpy.mock.calls.some((args) =>
        String(args[0]).includes('same key'),
      ),
    ).toBe(false);

    errorSpy.mockRestore();
  });

  it('does not duplicate a section label when clicking an item changes the selection', () => {
    render(
      <NavigationRail defaultExtended={true}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Clock" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Timer" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Stopwatch" />
        <NavigationRailSection label="Sleep well" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Schedule" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Stats" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Sleep sound" />
      </NavigationRail>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clock' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stats' }));

    expect(screen.getAllByText('Sleep well')).toHaveLength(1);
  });

  it('only renders NavigationRailSection labels while extended', () => {
    const { rerender } = render(
      <NavigationRail extended={false}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
        <NavigationRailSection label="Sleep well" />
      </NavigationRail>,
    );
    expect(screen.queryByText('Sleep well')).not.toBeInTheDocument();

    rerender(
      <NavigationRail extended={true}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
        <NavigationRailSection label="Sleep well" />
      </NavigationRail>,
    );
    expect(screen.getByText('Sleep well')).toBeInTheDocument();
  });

  it('exposes the resolved extended state to state-aware classes', () => {
    const className = vi.fn(() => ({}));
    render(
      <NavigationRail extended className={className}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
      </NavigationRail>,
    );

    expect(className).toHaveBeenCalledWith(
      expect.objectContaining({ isExtended: true }),
    );
  });

  it('has no automated accessibility violations', async () => {
    const view = render(
      <NavigationRail>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" selected />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Clock" />
      </NavigationRail>,
    );

    expect(await axe(view.container)).toHaveNoViolations();
  });
});

describe('NavigationRailItem', () => {
  it('exposes aria-current="page" only for the item matching the tracked index', () => {
    render(
      <NavigationRail selectedItem={0}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Clock" />
      </NavigationRail>,
    );

    expect(screen.getByRole('button', { name: 'Alarm' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('button', { name: 'Clock' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('falls back to its own uncontrolled selected flag without a tracked index', () => {
    render(
      <NavigationRailItem
        icon={iAlarm}
        iconSelected={iAlarm}
        label="Alarm"
        selected
      />,
    );

    expect(screen.getByRole('button', { name: 'Alarm' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('notifies the parent exactly once when it becomes the selected item', () => {
    const onItemSelected = vi.fn();
    render(
      <NavigationRail selectedItem={0} onItemSelected={onItemSelected}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
      </NavigationRail>,
    );

    expect(onItemSelected).toHaveBeenCalledTimes(1);
    expect(onItemSelected).toHaveBeenCalledWith(
      expect.objectContaining({ index: 0, label: 'Alarm' }),
    );
  });

  it('renders as a native link when href is provided', () => {
    render(
      <NavigationRailItem
        icon={iAlarm}
        iconSelected={iAlarm}
        label="Docs"
        href="/docs"
      />,
    );

    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
      'href',
      '/docs',
    );
  });

  it('always renders one label per layout, and reveals only the one matching the resolved variant', () => {
    // Regression test: the label used to be a single mount/unmount span
    // driven by `motion/react`'s AnimatePresence; it is now two always-
    // mounted spans (horizontal/vertical) whose visibility is driven by the
    // shared `@udixio/core/dom` label controller, keyed off the rail's
    // `extended` state via `variant`.
    render(
      <NavigationRail defaultExtended={false}>
        <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />
      </NavigationRail>,
    );

    const button = screen.getByRole('button', { name: 'Alarm' });
    const [horizontalLabel, verticalLabel] = Array.from(
      button.querySelectorAll('span'),
    ).filter((span) => span.textContent === 'Alarm');

    expect(horizontalLabel).toHaveAttribute('aria-hidden', 'true');
    expect(verticalLabel).toHaveAttribute('aria-hidden', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(horizontalLabel).toHaveAttribute('aria-hidden', 'false');
    expect(verticalLabel).toHaveAttribute('aria-hidden', 'true');
  });

  it('only exposes one label in server-rendered markup, before any effect runs', () => {
    // Regression test: the label's resting width/height/opacity/aria-hidden
    // used to be set entirely by a useLayoutEffect, which never runs during
    // SSR. The server-rendered (and pre-hydration first-paint) markup had
    // neither label styled, so both showed simultaneously until hydration
    // caught up -- exactly the "doubled labels that fix themselves a
    // moment later" the collapsed default was reported to look like.
    // renderToStaticMarkup never runs effects, so it reproduces that
    // pre-hydration snapshot directly.
    const collapsedHtml = renderToStaticMarkup(
      <NavigationRailItem icon={iAlarm} iconSelected={iAlarm} label="Alarm" />,
    );
    const collapsedSpans = [
      ...collapsedHtml.matchAll(/<span[^>]*>Alarm<\/span>/g),
    ].map((m) => m[0]);
    expect(collapsedSpans).toHaveLength(2);
    const collapsedHidden = collapsedSpans.filter((span) =>
      span.includes('aria-hidden="true"'),
    );
    const collapsedVisible = collapsedSpans.filter((span) =>
      span.includes('aria-hidden="false"'),
    );
    expect(collapsedHidden).toHaveLength(1);
    expect(collapsedVisible).toHaveLength(1);
    // The hidden label must already be visually collapsed (width/opacity 0),
    // not just marked aria-hidden -- otherwise it would still render at
    // full size, which is the actual "doubled labels" symptom.
    expect(collapsedHidden[0]).toMatch(/style="[^"]*width:0/);
    expect(collapsedHidden[0]).toMatch(/style="[^"]*opacity:0/);
    expect(collapsedVisible[0]).not.toMatch(/opacity:0/);

    const extendedHtml = renderToStaticMarkup(
      <NavigationRailItem
        icon={iAlarm}
        iconSelected={iAlarm}
        label="Alarm"
        variant="horizontal"
      />,
    );
    const extendedSpans = [
      ...extendedHtml.matchAll(/<span[^>]*>Alarm<\/span>/g),
    ].map((m) => m[0]);
    const extendedHidden = extendedSpans.filter((span) =>
      span.includes('aria-hidden="true"'),
    );
    const extendedVisible = extendedSpans.filter((span) =>
      span.includes('aria-hidden="false"'),
    );
    expect(extendedHidden).toHaveLength(1);
    expect(extendedVisible).toHaveLength(1);
    expect(extendedHidden[0]).toMatch(/style="[^"]*height:0/);
    expect(extendedHidden[0]).toMatch(/style="[^"]*opacity:0/);
    expect(extendedVisible[0]).not.toMatch(/opacity:0/);
  });
});
