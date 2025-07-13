import { ColorEntity, ColorOptions } from './entities/color.entity';

export interface ColorInterface {
  addColor(key: string, color: ColorOptions): ColorEntity;

  removeColor(key: string): boolean;

  getColor(key: string): ColorEntity;

  updateColor(key: string, newColor: ColorOptions): ColorEntity;

  getAllColors(): ReadonlyMap<string, ColorEntity>;

  addColors(colors: Record<string, ColorOptions>): ColorEntity[];
}
