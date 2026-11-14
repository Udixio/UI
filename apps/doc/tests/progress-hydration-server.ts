import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import {
  provideServerRendering,
  renderApplication,
} from '@angular/platform-server';
import { ProgressHydrationFixture } from '../../../packages/ui-angular/tests/fixtures/progress-hydration';

export function renderFixture() {
  return renderApplication(
    (context) =>
      bootstrapApplication(
        ProgressHydrationFixture,
        {
          providers: [provideClientHydration(), provideServerRendering()],
        },
        context,
      ),
    {
      document:
        '<html><head></head><body><progress-hydration-fixture></progress-hydration-fixture></body></html>',
    },
  );
}
