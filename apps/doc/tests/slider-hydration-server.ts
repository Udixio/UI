import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import {
  provideServerRendering,
  renderApplication,
} from '@angular/platform-server';
import { SliderHydrationFixture } from '../../../packages/ui-angular/tests/fixtures/slider-hydration';

export function renderFixture() {
  return renderApplication(
    (context) =>
      bootstrapApplication(
        SliderHydrationFixture,
        { providers: [provideClientHydration(), provideServerRendering()] },
        context,
      ),
    {
      document:
        '<html><head></head><body><slider-hydration-fixture></slider-hydration-fixture></body></html>',
    },
  );
}
