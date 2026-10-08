import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  ViewEncapsulation,
  afterRenderEffect,
  effect,
  input,
  output,
  signal,
  inject,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  createDynamicThemeWorker,
  createDynamicThemeWorkerMessage,
  DynamicThemeRuntime,
  TailwindPlugin,
} from '@udixio/tailwind';
import type { API, ConfigInterface } from '@udixio/theme';

/**
 * Generates and injects the dynamic theme stylesheet for projected content.
 * Supply `initialCss` when server rendering to avoid a flash before the first
 * client-side generation completes.
 * @status beta
 * @devx Wrap the content that uses `dynamicSelector`; config updates are throttled.
 * @a11y The provider adds no user-facing semantics.
 * @limitations Falls back to main-thread CSS generation if Web Workers are unavailable.
 */
@Component({
  selector: 'udx-theme-provider',
  standalone: true,
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '<ng-content />',
})
export class ThemeProvider implements OnDestroy {
  /** The configuration returned by `defineConfig`. */
  readonly config = input.required<Readonly<ConfigInterface>>();
  /** Milliseconds between rebuilds while config updates are arriving. @default 100 */
  readonly throttleDelay = input(100);
  /** Run configured plugins during the first load. @default false */
  readonly loadTheme = input(false);
  /** CSS generated on the server; rendered before browser generation completes. */
  readonly initialCss = input<string>();
  /** Emits the theme API after each successful stylesheet generation. */
  readonly load = output<API>();

  protected readonly css = signal<string | null>(null);
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly styleElement = this.renderer.createElement(
    'style',
  ) as HTMLStyleElement;
  private runtime: DynamicThemeRuntime | null = null;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    this.renderer.setAttribute(
      this.styleElement,
      'data-udx-theme-provider',
      '',
    );
    this.renderer.appendChild(this.document.head, this.styleElement);

    effect(() => {
      if (!this.runtime) this.css.set(this.initialCss() ?? null);
    });

    effect(() => {
      this.renderer.setProperty(
        this.styleElement,
        'textContent',
        this.css() ?? this.initialCss() ?? '',
      );
    });

    afterRenderEffect(() => {
      const config = this.config();
      const throttleDelay = this.throttleDelay();

      if (this.runtime) {
        this.runtime.update(config, throttleDelay);
        return;
      }

      if (!this.isBrowser) return;

      const runtime = new DynamicThemeRuntime({
        config,
        loadTheme: this.loadTheme(),
        throttleDelay,
        createWorker: createDynamicThemeWorker,
        createWorkerMessage: createDynamicThemeWorkerMessage,
        getCss: (api) =>
          api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss,
        onCss: (css) => this.css.set(css),
        onLoad: (api) => this.load.emit(api),
      });
      this.runtime = runtime;
      runtime.start();
    });
  }

  ngOnDestroy(): void {
    this.runtime?.destroy();
    this.runtime = null;
    const parent = this.renderer.parentNode(this.styleElement);
    if (parent) this.renderer.removeChild(parent, this.styleElement);
  }
}
