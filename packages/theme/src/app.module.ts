import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ColorModule } from './color/color.module';
import { ThemeModule } from './theme/theme.module';

@Module({
  imports: [ColorModule, ThemeModule],
  providers: [AppService],
})
export class AppModule {}
