import { TestBed } from '@angular/core/testing';
import { DatePicker } from './date-picker';

// The markup of the first render, before the component's mount hook runs, is the one the
// server produces and the browser must hydrate. The hook is stubbed here so that render can
// be read on its own; the other suites cover the mounted calendar.
jest.mock('@angular/core', () => ({
  ...jest.requireActual('@angular/core'),
  afterNextRender: () => ({ destroy: () => undefined }),
}));

describe('DatePicker (Angular) first render', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DatePicker] }).compileComponents();
    jest.useFakeTimers({
      doNotFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'setImmediate',
        'clearImmediate',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'queueMicrotask',
        'nextTick',
      ],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // `locale="default"` resolves through Intl to the runtime's locale: this stands in for a
  // server or a browser running with another one.
  function firstRender(
    inputs: Record<string, unknown>,
    runtimeLocale: string,
  ): { html: string; gridLabel: string | null; weekDays: string[] } {
    const RealDateTimeFormat = Intl.DateTimeFormat;
    const spy = jest
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
    try {
      const fixture = TestBed.createComponent(DatePicker);
      for (const [name, value] of Object.entries(inputs)) {
        fixture.componentRef.setInput(name, value);
      }
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const result = {
        html: element.innerHTML,
        gridLabel: element.querySelector('[role="grid"]')?.getAttribute('aria-label') ?? null,
        weekDays: Array.from(element.querySelectorAll('[role="columnheader"]')).map(
          (header) => header.textContent?.trim() ?? '',
        ),
      };
      fixture.destroy();
      return result;
    } finally {
      spy.mockRestore();
    }
  }

  it('renders no month name, weekday letter or day without an explicit locale and value', () => {
    jest.setSystemTime(new Date(2026, 10, 17));
    const server = firstRender({}, 'fr-FR');
    jest.setSystemTime(new Date(2027, 2, 3));
    const browser = firstRender({}, 'en-US');

    expect(server.html).not.toContain('data-date');
    expect(server.gridLabel).toBeNull();
    expect(server.weekDays).toEqual(['', '', '', '', '', '', '']);
    expect(browser).toEqual(server);
  });

  it('renders the pinned view identically whatever the clock, without today marker', () => {
    const inputs = { defaultValue: new Date(2026, 10, 17), locale: 'en-US' };
    jest.setSystemTime(new Date(2026, 10, 17));
    const server = firstRender(inputs, 'fr-FR');
    expect(server.html).toContain('November 2026');
    expect(server.html).toContain('data-date');
    expect(server.html).not.toContain('aria-current');

    jest.setSystemTime(new Date(2027, 2, 3));
    const browser = firstRender(inputs, 'en-US');

    expect(browser).toEqual(server);
  });
});
