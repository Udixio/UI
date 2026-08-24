import { Color } from './color.base';
import type { ColorInput } from './color.types';
import type { API } from '../API';

export class ColorManager {
  private colorMap = new Map<string, Color>();
  private _version = 0;

  /** Posée par `API` à sa construction, avant que la moindre couleur soit lue. */
  api!: API;

  get version(): number {
    return this._version;
  }

  constructor() {}

  createOrUpdate(key: string, args: ColorInput): Color {
    let colorEntity: Color;
    if (args instanceof Color) {
      colorEntity = args;
    } else if (typeof args === 'string') {
      colorEntity = Color.fromHex(args);
    } else {
      throw new Error(`Invalid color input provided for ${key}`);
    }

    const initializedColor = colorEntity.init(this.api);
    this.colorMap.set(key, initializedColor);
    this._version += 1;
    return initializedColor;
  }

  public remove(key: string) {
    const removed = this.colorMap.delete(key);
    if (removed) this._version += 1;
    return removed;
  }

  public clear() {
    if (this.colorMap.size > 0) {
      this.colorMap.clear();
      this._version += 1;
    }
  }

  public get(key: string): Color {
    const colorEntity = this.colorMap.get(key);
    if (colorEntity) {
      return colorEntity;
    } else {
      throw new Error(`Color ${key} does not exist`);
    }
  }

  public getAll(): ReadonlyMap<string, Color> {
    return this.colorMap;
  }
}
