import { ColorService } from './color.service';
import { Module } from '@nestjs/common';
import { DefaultColorModel } from './models/default-color.model';
import { ColorManagerService } from './color-manager.service';
import { ThemeModule } from '../theme/theme.module';

@Module({
  imports: [ThemeModule],
  providers: [DefaultColorModel, ColorService, ColorManagerService],
  exports: [ColorService],
})
export class ColorModule {}
