import {
  Color,
  ColorAlias,
  ColorFromHex,
  ColorFromPalette,
  ColorOptions,
} from './color';
import { Context } from '../context';

export class ColorManager {
  private colorMap = new Map<string, Color>();
  private readonly context: Context;

  constructor(args: { context: Context }) {
    this.context = args.context;
  }

  createOrUpdate(key: string, args: ColorOptions): Color {
    let colorEntity = this.colorMap.get(key);
    if ('alias' in args) {
      colorEntity = new ColorAlias(key, args.alias, this);
    } else if ('hex' in args) {
      colorEntity = new ColorFromHex(key, args.hex);
    } else {
      try {
        if (colorEntity instanceof ColorFromPalette) {
          colorEntity.update(args);
        } else {
          colorEntity = new ColorFromPalette(key, args, this.context);
        }
      } catch (e) {
        console.error(e);
        throw new Error(`Invalid color options provided for ${key}`);
      }
    }
    this.colorMap.set(key, colorEntity);
    return colorEntity;
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
