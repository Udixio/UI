import '@angular/compiler';
import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { SwitchHydrationFixture } from './switch-hydration';

bootstrapApplication(SwitchHydrationFixture, {
  providers: [provideClientHydration()],
}).then((app) => {
  (window as any).dispose = () => app.destroy();
  (window as any).hydrated = true;
});
