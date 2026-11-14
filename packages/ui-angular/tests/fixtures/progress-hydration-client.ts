import '@angular/compiler';
import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { ProgressHydrationFixture } from './progress-hydration';

bootstrapApplication(ProgressHydrationFixture, {
  providers: [provideClientHydration()],
}).then((app) => {
  (window as any).dispose = () => app.destroy();
  (window as any).hydrated = true;
});
