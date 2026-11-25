import { Component } from '@angular/core';
import { defineMotion } from '@udixio/motion';
import { Motion } from '@udixio/ui-angular';

// Only a reveal can replace a rise: not a presence.
defineMotion('fade-on-view', {
  verb: 'reveal',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
});

@Component({
  selector: 'docs-motion-scopes-breakpoints-angular',
  standalone: true,
  imports: [Motion],
  template: `
    <section class="flex flex-col gap-3">
      <article udxMotion="rise">Plain</article>
      <article udxMotion="rise" class="md:motion-[fade-on-view]">Fades from md</article>
      <article udxMotion="rise" class="motion-none">Off</article>
    </section>
  `,
})
export class MotionScopesBreakpointsAngular {}
