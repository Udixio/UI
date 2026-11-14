import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import {
  provideServerRendering,
  renderApplication,
} from '@angular/platform-server';
import { SwitchHydrationFixture } from '../../../packages/ui-angular/tests/fixtures/switch-hydration';

export function renderFixture() {
  return renderApplication(
    (context) =>
      bootstrapApplication(
        SwitchHydrationFixture,
        { providers: [provideClientHydration(), provideServerRendering()] },
        context,
      ),
    {
      document:
        '<html><head></head><body><switch-hydration-fixture></switch-hydration-fixture></body></html>',
    },
  );
}
