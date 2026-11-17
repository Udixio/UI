import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync, mount, unmount } from 'svelte';
import DatePicker from './DatePicker.svelte';
import type { SvelteDatePickerProps } from './date-picker.types';

describe('DatePicker', () => {
  afterEach(cleanup);

  it('renders a grid and reports a day selection', async () => {
    const onChange = vi.fn();
    render(DatePicker, { props: { onChange, value: new Date(2026, 8, 1) } });
    expect(screen.getByRole('grid')).toBeInTheDocument();
    const day = document.querySelector('[data-date]') as HTMLElement;
    expect(day).toBeTruthy();
    await fireEvent.click(day);
    expect(onChange).toHaveBeenCalled();
  });

  describe('first render', () => {
    // `locale="default"` resolves through Intl to the runtime's locale: this stands in for a
    // server or a browser running with another one.
    function firstRender(props: SvelteDatePickerProps, runtimeLocale: string) {
      const RealDateTimeFormat = Intl.DateTimeFormat;
      const spy = vi
        .spyOn(Intl, 'DateTimeFormat')
        .mockImplementation(function (
          locales?: string | string[],
          options?: Intl.DateTimeFormatOptions,
        ) {
          return new RealDateTimeFormat(
            locales === 'default' ? runtimeLocale : locales,
            options,
          );
        } as typeof Intl.DateTimeFormat);
      const target = document.createElement('div');
      document.body.append(target);
      try {
        // mount() does not flush effects: the DOM read before flushSync() is the first render,
        // the one a server produces and the browser must hydrate.
        const component = mount(DatePicker, { target, props });
        const first = {
          html: target.innerHTML,
          gridLabel: target.querySelector('[role="grid"]')?.getAttribute('aria-label') ?? null,
          weekDays: Array.from(target.querySelectorAll('[role="columnheader"]'), (header) => header.textContent?.trim() ?? ''),
        };
        flushSync();
        unmount(component);
        return first;
      } finally {
        spy.mockRestore();
        target.remove();
      }
    }

    it('renders no month name, weekday letter or day before mount, whatever the clock and locale', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 17));
      const server = firstRender({}, 'fr-FR');
      vi.setSystemTime(new Date(2027, 2, 3));
      const browser = firstRender({}, 'en-US');
      vi.useRealTimers();

      expect(server.html).not.toContain('data-date');
      expect(server.gridLabel).toBeNull();
      expect(server.weekDays).toEqual(['', '', '', '', '', '', '']);
      expect(browser).toEqual(server);
    });

    it('renders the pinned view identically whatever the clock, without today marker', () => {
      const props = { value: new Date(2026, 10, 17), locale: 'en-US' };
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 17));
      const server = firstRender(props, 'fr-FR');
      expect(server.html).toContain('November 2026');
      expect(server.html).toContain('data-date');
      expect(server.html).not.toContain('aria-current');

      vi.setSystemTime(new Date(2027, 2, 3));
      const browser = firstRender(props, 'en-US');
      vi.useRealTimers();

      expect(browser).toEqual(server);
    });
  });
});
