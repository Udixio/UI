import { Injectable } from '@nestjs/common';
import { DefaultColorModel } from './models/default-color.model';
import { ColorManagerService } from './color-manager.service';
import { ColorInterface } from './color.interface';
import { ColorEntity, ColorOptions } from './entities/color.entity';

@Injectable()
export class ColorService implements ColorInterface {
  constructor(
    private defaultColorModel: DefaultColorModel,
    private colorManagerService: ColorManagerService
  ) {}

  getAllColors() {
    return this.colorManagerService.getAll();
  }

  // getColors() {
  //   const colors: Record<string, string> = {};
  //
  //   for (const [key, value] of this.colorManagerService.getAll()) {
  //     colors[key] = hexFromArgb(value.getArgb(this.schemeService.get()));
  //   }
  //
  //   return colors;
  // }

  addBaseColors() {
    this.colorManagerService.addFromPalette('primary');
    this.colorManagerService.addFromPalette('secondary');
    this.colorManagerService.addFromPalette('tertiary');
    for (const [key, value] of Object.entries(this.defaultColorModel.colors)) {
      this.colorManagerService.createOrUpdate(key, value as any);
    }
  }

  addColor(key: string, color: ColorOptions): ColorEntity {
    return this.colorManagerService.createOrUpdate(key, color);
  }

  addColors(colors: Record<string, ColorOptions>): ColorEntity[] {
    return Object.keys(colors).map((key) => this.addColor(key, colors[key]));
  }

  getColor(key: string): ColorEntity {
    return this.colorManagerService.get(key);
  }

  removeColor(key: string): boolean {
    return this.colorManagerService.remove(key);
  }

  updateColor(key: string, newColor: Partial<ColorOptions>): ColorEntity {
    return this.colorManagerService.createOrUpdate(key, newColor);
  }
}
