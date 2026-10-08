import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as Tailwind from '@udixio/tailwind';
import { ThemeProvider } from './theme-provider';
import {
  createUdixioProviderConfig,
  expectedThemeCssColors,
  readThemeCssColors,
  ThemeProviderWorkerMock,
  UDIXIO_THEME_PROVIDER_REFERENCE,
  waitForThemeCss,
} from '../../../../tailwind/tests/theme-provider-test-utils';

describe('ThemeProvider (Angular)', () => {
  let fixture: ComponentFixture<ThemeProvider>;
  const originalWorker = globalThis.Worker;

  beforeEach(async () => {
    ThemeProviderWorkerMock.reset();
    jest
      .spyOn(Tailwind, 'createDynamicThemeWorker')
      .mockImplementation(() => new ThemeProviderWorkerMock());
    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: ThemeProviderWorkerMock,
    });

    await TestBed.configureTestingModule({
      imports: [ThemeProvider],
    }).compileComponents();
    fixture = TestBed.createComponent(ThemeProvider);
    fixture.componentRef.setInput(
      'config',
      createUdixioProviderConfig(
        UDIXIO_THEME_PROVIDER_REFERENCE.cases.purpleLight,
      ),
    );
    fixture.componentRef.setInput('throttleDelay', 0);
  });

  afterEach(() => {
    fixture.destroy();
    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: originalWorker,
    });
    jest.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('matches the pinned Udixio theme output and updates it through the shared worker', async () => {
    const loaded = jest.fn();
    fixture.componentInstance.load.subscribe(loaded);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const readCss = () => {
      fixture.detectChanges();
      return (
        document.head.querySelector<HTMLStyleElement>(
          'style[data-udx-theme-provider]',
        )?.textContent ?? ''
      );
    };
    const initialCss = await waitForThemeCss(
      readCss,
      expectedThemeCssColors('purple'),
    );

    expect(readThemeCssColors(initialCss)).toEqual(
      expectedThemeCssColors('purple'),
    );
    expect(fixture.componentInstance.config().variant?.name).toBe(
      UDIXIO_THEME_PROVIDER_REFERENCE.variant,
    );
    expect(ThemeProviderWorkerMock.instances).toHaveLength(1);
    expect(ThemeProviderWorkerMock.instances[0].messages).toHaveLength(0);
    expect(loaded).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput(
      'config',
      createUdixioProviderConfig(UDIXIO_THEME_PROVIDER_REFERENCE.cases.redDark),
    );
    fixture.detectChanges();

    const updatedCss = await waitForThemeCss(
      readCss,
      expectedThemeCssColors('red'),
    );

    expect(readThemeCssColors(updatedCss)).toEqual(
      expectedThemeCssColors('red'),
    );
    expect(ThemeProviderWorkerMock.instances[0].messages).toHaveLength(1);
    expect(loaded).toHaveBeenCalledTimes(2);

    fixture.destroy();
    expect(ThemeProviderWorkerMock.instances[0].terminated).toBe(true);
    expect(
      document.head.querySelector('style[data-udx-theme-provider]'),
    ).toBeNull();
  }, 15_000);
});
