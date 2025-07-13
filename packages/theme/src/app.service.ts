import { Injectable } from '@nestjs/common';
import { ColorService } from './color/color.service';
import { ThemeService } from './theme/services/theme.service';

@Injectable()
export class AppService {
  constructor(
    public colorService: ColorService,
    public themeService: ThemeService
  ) {}
}
