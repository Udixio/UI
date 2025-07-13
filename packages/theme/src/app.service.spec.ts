import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from '../src/app.service';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let appService: AppService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    appService = moduleRef.get<AppService>(AppService);
  });
});
