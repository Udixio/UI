import { argbFromHex } from '@material/material-color-utilities';
import { Hct } from '../material-color-utilities/htc';
import { Variant } from '../variant/variant';

export interface ContextOptions {
  sourceColor: string | Hct;
  contrastLevel: number;
  isDark: boolean;
  variant: Variant;
}

export class Context {
  private _options?: ContextOptions;
  private _temOptions: ContextOptions | null = null;
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

  set(options: ContextOptions) {
    if (this._options) {
      console.error(this._options);
      throw new Error('Options already set');
    }
    if (typeof options.sourceColor === 'string') {
      options.sourceColor = Hct.fromInt(argbFromHex(options.sourceColor));
    }

    const changed: (keyof Context)[] = [];
    for (const key of Object.keys(options) as (keyof ContextOptions)[]) {
      changed.push(key);
    }

    this._options = options;

    if (changed.length > 0) {
      this.updateCallbacks.forEach((callback) => callback(changed));
    }
  }

  public update(args: Partial<ContextOptions>) {
    const options = this._options;
    if (!options) {
      throw new Error('Options not found');
    }
    if (typeof args.sourceColor === 'string') {
      args.sourceColor = Hct.fromInt(argbFromHex(args.sourceColor));
    }

    // compute changed keys
    const changed: (keyof Context)[] = [];
    for (const key of Object.keys(args) as (keyof ContextOptions)[]) {
      if ((args as any)[key] !== (options as any)[key]) {
        changed.push(key);
      }
    }

    this._options = {
      ...options,
      ...args,
    };

    // notify listeners with changed keys (if any)
    if (changed.length > 0) {
      this.updateCallbacks.forEach((callback) => callback(changed));
    }
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

  set sourceColor(sourceColor: string) {
    this.update({ sourceColor });
  }
  get sourceColor(): Hct {
    let sourceColor = this.getOptions().sourceColor;
    if (typeof sourceColor === 'string') {
      sourceColor = Hct.fromInt(argbFromHex(sourceColor));
    }
    return sourceColor;
  }

  set variant(variant: Variant) {
    this.update({ variant });
  }
  get variant() {
    return this.getOptions().variant;
  }

  temp<T>(args: Partial<ContextOptions>, callback: () => T): T {
    const previousOptions = this.getOptions();
    this._temOptions = {
      ...previousOptions,
      ...args,
    };
    const result = callback();
    this._temOptions = null;
    return result;
  }

  onUpdate(callback: (changed: (keyof Context)[]) => void): void {
    this.updateCallbacks.push(callback);
  }
}
