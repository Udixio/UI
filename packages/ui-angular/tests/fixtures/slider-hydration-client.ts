import '@angular/compiler';
import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { SliderHydrationFixture } from './slider-hydration';

bootstrapApplication(SliderHydrationFixture, {
  providers: [provideClientHydration()],
}).then((app) => {
  (window as any).dispose = () => app.destroy();
  (window as any).hydrated = true;
});
