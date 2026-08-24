import { Color } from '../color/color.base';
import type { API } from '../API';
import type { Variant } from '../variant/variant';
import type { SourceColor } from '../config';

export interface ContextOptions {
  sourceColor: SourceColor;
  contrastLevel: number;
  isDark: boolean;
  variant: Variant;
}

export class Context {
  private _options?: ContextOptions;
  private _temOptions: ContextOptions | null = null;
  private _version = 0;
  private api?: API;
  private readonly updateCallbacks: Array<
    (changed: (keyof Context)[]) => void
  > = [];

  constructor() {
    this.onUpdate((changed) => {
      if (changed.includes('variant')) {
        this.variant.init(this);
      }
    });
  }

  /**
   * Runs the provided callback with a proxied Context and records which Context
   * properties (getters) were accessed during its execution.
   *
   * This helps determine dependencies of the callback on the Context.
   *
   * Example usage:
   * const { result, dependencies } = Context.trackDependencies(ctx, (c) => cb(c));
   */
  static trackDependencies<T>(
    context: Context,
    callback: (ctx: Context) => T,
  ): { result: T; dependencies: (keyof Context)[] } {
    const dependencies = new Set<keyof Context>();

    const isGetterOnContext = (prop: PropertyKey): boolean => {
      if (typeof prop !== 'string') return false;
      const desc = Object.getOwnPropertyDescriptor(Context.prototype, prop);
      return !!desc && typeof desc.get === 'function';
    };

    const proxy = new Proxy(context, {
      get(target, prop, receiver) {
        if (isGetterOnContext(prop)) {
          dependencies.add(prop as keyof Context);
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    const result = callback(proxy as unknown as Context);
    return { result, dependencies: Array.from(dependencies) };
  }

  /** Fournit le contexte d'exécution aux couleurs utilisées comme source. */
  init(api: API): void {
    this.api = api;
    const options = this._options;
    if (options?.sourceColor instanceof Color) {
      this._options = {
        ...options,
        sourceColor: options.sourceColor.init(api),
      };
    }
  }

  private normalizeSourceColor(sourceColor: SourceColor): SourceColor {
    if (typeof sourceColor === 'string') {
      return Color.fromHex(sourceColor);
    }
    if (sourceColor instanceof Color && this.api) {
      return sourceColor.init(this.api);
    }
    return sourceColor;
  }

  set(options: ContextOptions) {
    if (this._options) {
      return this.update(options);
    }

    const normalizedOptions = {
      ...options,
      sourceColor: this.normalizeSourceColor(options.sourceColor),
    };
    const changed: (keyof Context)[] = [];
    for (const key of Object.keys(
      normalizedOptions,
    ) as (keyof ContextOptions)[]) {
      changed.push(key);
    }

    this._options = normalizedOptions;

    if (changed.length > 0) {
      this._version += 1;
      this.updateCallbacks.forEach((callback) => callback(changed));
    }
  }

  public update(args: Partial<ContextOptions>) {
    const options = this._options;
    if (!options) {
      throw new Error('Options not found');
    }

    const normalizedArgs =
      args.sourceColor === undefined
        ? args
        : {
            ...args,
            sourceColor: this.normalizeSourceColor(args.sourceColor),
          };

    // compute changed keys
    const changed: (keyof Context)[] = [];
    for (const key of Object.keys(normalizedArgs) as (keyof ContextOptions)[]) {
      if ((normalizedArgs as any)[key] !== (options as any)[key]) {
        changed.push(key);
      }
    }

    this._options = {
      ...options,
      ...normalizedArgs,
    };

    // notify listeners with changed keys (if any)
    if (changed.length > 0) {
      this._version += 1;
      this.updateCallbacks.forEach((callback) => callback(changed));
    }
  }

  /**
   * Version monotone utilisée par les résolutions mémoïsées.
   *
   * Elle change avant les callbacks afin qu'une couleur lue pendant un
   * callback observe déjà la nouvelle génération du contexte.
   */
  get version(): number {
    return this._version;
  }

  private getOptions(): ContextOptions {
    let options;
    if (this._temOptions) {
      options = this._temOptions;
    } else {
      options = this._options;
    }
    if (!options) {
      throw new Error('Options not found');
    }
    return options;
  }

  set darkMode(isDark: boolean) {
    this.update({ isDark });
  }
  get isDark() {
    return this.getOptions().isDark;
  }

  set contrastLevel(contrastLevel: number) {
    this.update({ contrastLevel });
  }
  get contrastLevel() {
    return this.getOptions().contrastLevel;
  }

  set sourceColor(sourceColor: SourceColor) {
    this.update({ sourceColor });
  }
  get sourceColor(): Color {
    const sourceColor = this.getOptions().sourceColor;
    const resolved =
      typeof sourceColor === 'function' ? sourceColor(this) : sourceColor;
    if (typeof resolved === 'string') return Color.fromHex(resolved);
    return this.api ? resolved.init(this.api) : resolved;
  }
  get rawSourceColor(): ContextOptions['sourceColor'] {
    return this.getOptions().sourceColor;
  }

  set variant(variant: Variant) {
    this.update({ variant });
  }
  get variant() {
    return this.getOptions().variant;
  }

  temp<T>(args: Partial<ContextOptions>, callback: () => T): T {
    const previousOptions = this.getOptions();
    this._version += 1;
    this._temOptions = {
      ...previousOptions,
      ...args,
    };
    try {
      return callback();
    } finally {
      this._temOptions = null;
      this._version += 1;
    }
  }

  onUpdate(callback: (changed: (keyof Context)[]) => void): void {
    this.updateCallbacks.push(callback);
  }
}
