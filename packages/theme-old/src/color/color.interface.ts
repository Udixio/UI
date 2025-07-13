import { ColorEntity, ColorOptions } from './entities/color.entity';

export interface ColorInterface {
  addColor(key: string, color: ColorOptions): ColorEntity;

  removeColor(key: string): boolean;

  getColor(key: string): ColorEntity;

  updateColor(key: string, newColor: ColorOptions): ColorEntity;

  getColors(): ReadonlyMap<string, ColorEntity>;
}
