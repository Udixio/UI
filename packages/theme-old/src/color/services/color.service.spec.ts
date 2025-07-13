import { ColorService } from './color.service';
import { ColorModule } from '../color.module';
import { Test } from '@nestjs/testing';

describe('ColorService', () => {
  let colorService: ColorService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ColorModule],
    }).compile();

    colorService = moduleRef.get(ColorService);
  });

  it('should return an array of cats', async () => {
    const result = colorService['dynamicColorService']['colorMap'].entries();
    console.log(result);

    colorService.addBaseColors();
    // for (const [key, value] of Object.entries(defaultColorModel.colors)) {
    //   colorService.update(key, value);
    // }

    console.dir(result, { depth: null });
    // expect(await catsController.findAll()).toBe(result);
  });
});
