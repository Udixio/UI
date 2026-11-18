import { Component, ElementRef, viewChild } from '@angular/core';
import { defineMotion, getMotion } from '@udixio/motion';
import { revert } from '@udixio/motion/scope';
import { Motion } from '@udixio/ui-angular';

// A reveal names a reveal: a presence such as `fade` would be ignored on a rise.
defineMotion('fade-on-view', {
  verb: 'reveal',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
});

@Component({
  selector: 'docs-motion-scopes-angular',
  standalone: true,
  imports: [Motion],
  template: `
    <section #section class="flex flex-col gap-3">
      <article udxMotion="rise">Plain</article>
      <article
        udxMotion="rise"
        class="md:[--udx-motion:fade-on-view]"
      >Fades from md</article>
      <article udxMotion="rise" class="[--udx-motion:none]">Off</article>
      <button type="button" (click)="replay()">Replay</button>
      <button type="button" (click)="teardown()">Remove the motions</button>
    </section>
  `,
})
export class MotionScopesAngular {
  private readonly section = viewChild.required<ElementRef<HTMLElement>>('section');

  protected replay(): void {
    for (const card of this.section().nativeElement.querySelectorAll('article')) getMotion(card)?.play();
  }

  // The motions under the section stop; its markup stays.
  protected teardown(): void {
    revert(this.section().nativeElement);
  }
}
