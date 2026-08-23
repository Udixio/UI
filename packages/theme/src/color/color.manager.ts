import { Color } from './color.base';
import type { ColorInput } from './color.types';
import type { API } from '../API';

export class ColorManager {
  private colorMap = new Map<string, Color>();

  /** Posée par `API` à sa construction, avant que la moindre couleur soit lue. */
  api!: API;

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
    return initializedColor;
  }

  public remove(key: string) {
    return this.colorMap.delete(key);
  }

  public clear() {
    this.colorMap.clear();
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
