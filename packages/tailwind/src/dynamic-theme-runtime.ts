import {
  type API,
  type ConfigInterface,
  type ContextOptions,
  loader,
  type FontPluginOptions,
  type ThemeContextSnapshot,
} from '@udixio/theme';
import type { TailwindPluginOptions } from './browser/tailwind.plugin';

export interface DynamicThemeWorkerInboundMessage {
  id: number;
  snapshot: ThemeContextSnapshot;
  tailwindOptions: TailwindPluginOptions;
  fontOptions: FontPluginOptions;
}

export interface DynamicThemeWorkerOutboundMessage {
  id: number;
  css?: string;
  error?: string;
}

/** The small worker surface needed by the framework-neutral runtime. */
export interface DynamicThemeWorker {
  onmessage:
    ((event: MessageEvent<DynamicThemeWorkerOutboundMessage>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage(message: DynamicThemeWorkerInboundMessage): void;
  terminate(): void;
}

export interface DynamicThemeWorkerScope {
  onmessage:
    ((event: MessageEvent<DynamicThemeWorkerInboundMessage>) => void) | null;
  postMessage(message: DynamicThemeWorkerOutboundMessage): void;
}

export interface DynamicThemeRuntimeOptions {
  config: Readonly<ConfigInterface>;
  loadTheme?: boolean;
  throttleDelay?: number;
  createWorker?: () => DynamicThemeWorker | null;
  getCss: (api: API) => string;
  createWorkerMessage?: (
    id: number,
    api: API,
  ) => DynamicThemeWorkerInboundMessage;
  onCss: (css: string) => void;
  onLoad?: (api: API) => void;
}

type ThemeChange = Partial<ContextOptions> & {
  palettes?: ConfigInterface['palettes'];
  colors?: ConfigInterface['colors'];
};

/**
 * Owns dynamic theme generation and throttling without a framework dependency.
 * UI adapters provide their rendering callback and may provide the shared
 * worker factory and message serializer.
 */
export class DynamicThemeRuntime {
  private api: API | null = null;
  private worker: DynamicThemeWorker | null = null;
  private generation = 0;
  private changeGeneration = 0;
  private lastAppliedId = 0;
  private firstLoadDone = false;
  private previousConfig: Readonly<ConfigInterface> | null = null;
  private currentConfig: Readonly<ConfigInterface>;
  private loadTheme: boolean;
  private throttleDelay: number;
  private onCss: (css: string) => void;
  private onLoad?: (api: API) => void;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private lastExecTime = 0;
  private lastArgs: ThemeChange | null = null;
  private started = false;
  private destroyed = false;

  constructor(private readonly options: DynamicThemeRuntimeOptions) {
    this.currentConfig = options.config;
    this.loadTheme = options.loadTheme ?? false;
    this.throttleDelay = options.throttleDelay ?? 100;
    this.onCss = options.onCss;
    this.onLoad = options.onLoad;
  }

  start(): void {
    if (this.started || this.destroyed) return;
    this.started = true;

    void this.initialize();
  }

  update(
    config: Readonly<ConfigInterface>,
    throttleDelay = this.throttleDelay,
  ): void {
    this.currentConfig = config;
    this.throttleDelay = throttleDelay;
    if (!this.api || this.destroyed) return;

    this.applyConfig(config, throttleDelay);
  }

  setOnLoad(onLoad?: (api: API) => void): void {
    this.onLoad = onLoad;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.changeGeneration += 1;
    this.worker?.terminate();
    this.worker = null;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  private async initialize(): Promise<void> {
    const api = await loader(this.currentConfig, this.loadTheme);
    if (this.destroyed) return;

    this.api = api;
    try {
      this.worker = this.options.createWorker?.() ?? null;
    } catch {
      // A missing or blocked worker falls back to the same main-thread runtime.
      this.worker = null;
    }

    if (this.worker) {
      this.worker.onmessage = (event) => this.handleWorkerMessage(event.data);
      this.worker.onerror = () => this.handleWorkerFailure();
      this.worker.onmessageerror = () => this.handleWorkerFailure();
    }

    this.applyConfig(this.currentConfig, this.throttleDelay);
  }

  private applyConfig(
    config: Readonly<ConfigInterface>,
    throttleDelay: number,
  ): void {
    const previousConfig = this.previousConfig;
    const contextArgs: Partial<ContextOptions> = {};

    if (!previousConfig || previousConfig.sourceColor !== config.sourceColor) {
      contextArgs.sourceColor = config.sourceColor;
    }
    if (
      config.contrastLevel !== undefined &&
      (!previousConfig || previousConfig.contrastLevel !== config.contrastLevel)
    ) {
      contextArgs.contrastLevel = config.contrastLevel;
    }
    if (
      config.isDark !== undefined &&
      (!previousConfig || previousConfig.isDark !== config.isDark)
    ) {
      contextArgs.isDark = config.isDark;
    }
    if (
      config.variant !== undefined &&
      (!previousConfig || previousConfig.variant !== config.variant)
    ) {
      contextArgs.variant = config.variant;
    }

    const palettesChanged =
      !previousConfig || previousConfig.palettes !== config.palettes;
    const colorsChanged =
      !previousConfig || previousConfig.colors !== config.colors;
    const context: ThemeChange = {
      ...contextArgs,
      ...(palettesChanged ? { palettes: config.palettes } : {}),
      ...(colorsChanged ? { colors: config.colors } : {}),
    };

    this.previousConfig = config;
    if (Object.keys(context).length === 0) return;

    const now = Date.now();
    const timeSinceLast = now - this.lastExecTime;

    if (this.lastExecTime === 0 || timeSinceLast >= throttleDelay) {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      const pendingArgs = this.lastArgs;
      this.lastArgs = null;
      this.lastExecTime = now;
      void this.applyThemeChange(
        pendingArgs ? { ...pendingArgs, ...context } : context,
      );
      return;
    }

    // Keep all fields changed during the delay so a later update cannot erase
    // an earlier palette or color override.
    this.lastArgs = { ...(this.lastArgs ?? {}), ...context };
    if (!this.timeout) {
      const remaining = Math.max(0, throttleDelay - timeSinceLast);
      this.timeout = setTimeout(() => {
        this.timeout = null;
        const args = this.lastArgs;
        this.lastArgs = null;
        if (!args || this.destroyed) return;
        this.lastExecTime = Date.now();
        void this.applyThemeChange(args);
      }, remaining);
    }
  }

  private async loadThemeOnMainThread(
    api: API,
    changeGeneration: number,
  ): Promise<void> {
    await api.load();
    if (this.destroyed || changeGeneration !== this.changeGeneration) return;

    const css = this.options.getCss(api);
    this.onCss(css);
    this.firstLoadDone = true;
    this.onLoad?.(api);
  }

  private handleWorkerFailure(): void {
    const api = this.api;
    if (!api || this.destroyed) return;

    this.worker?.terminate();
    this.worker = null;
    this.firstLoadDone = false;

    const changeGeneration = ++this.changeGeneration;
    void this.loadThemeOnMainThread(api, changeGeneration);
  }

  private handleWorkerMessage(
    message: DynamicThemeWorkerOutboundMessage,
  ): void {
    if (message.id < this.generation || this.destroyed) return;
    if (message.error) {
      this.handleWorkerFailure();
      return;
    }
    if (!message.css || message.id <= this.lastAppliedId) return;

    this.lastAppliedId = message.id;
    this.firstLoadDone = true;
    this.onCss(message.css);
    if (this.api) this.onLoad?.(this.api);
  }

  private async applyThemeChange(context: ThemeChange): Promise<void> {
    if (
      typeof context.sourceColor === 'string' &&
      !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(context.sourceColor)
    ) {
      throw new Error('Invalid hex color');
    }

    const api = this.api;
    if (!api || this.destroyed) return;

    const changeGeneration = ++this.changeGeneration;
    const { palettes, colors, ...contextArgs } = context;
    api.context.update(contextArgs);
    if ('palettes' in context) api.palettes.sync(palettes);
    if ('colors' in context) api.colors.syncConfiguredColors(colors);

    if (
      !this.worker ||
      !this.firstLoadDone ||
      !this.options.createWorkerMessage
    ) {
      await this.loadThemeOnMainThread(api, changeGeneration);
      return;
    }

    const id = ++this.generation;
    this.worker.postMessage(this.options.createWorkerMessage(id, api));
  }
}
