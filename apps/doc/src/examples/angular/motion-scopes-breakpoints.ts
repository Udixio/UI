import { Component, ElementRef, viewChild, viewChildren } from '@angular/core';
import { defineMotion } from '@udixio/motion';
import { revert } from '@udixio/motion/scope';
import { Button, Motion } from '@udixio/ui-angular';

// A reveal can be replaced only by a reveal: a presence such as `fade` would be ignored on a rise.
defineMotion('fade-on-view', {
  verb: 'reveal',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
});

@Component({
  selector: 'docs-motion-scopes-breakpoints-angular',
  standalone: true,
  imports: [Button, Motion],
  template: `
    <section #section class="flex flex-col gap-3">
      <article udxMotion="rise">Plain</article>
      <article udxMotion="rise" class="md:motion-[fade-on-view]">Fades from md</article>
      <article udxMotion="rise" class="motion-none">Off</article>
      <div class="flex flex-wrap gap-2">
        <udx-button size="small" label="Replay" (click)="replay()" />
        <udx-button size="small" variant="outlined" label="Remove the motions" (click)="teardown()" />
      </div>
    </section>
  `,
})
export class MotionScopesBreakpointsAngular {
  private readonly section = viewChild.required<ElementRef<HTMLElement>>('section');
  private readonly cards = viewChildren(Motion);

  // play() on each directive replays its reveal from its first frame.
  protected replay(): void {
    for (const card of this.cards()) card.play();
  }

  // The motions under the section stop; its markup stays.
  protected teardown(): void {
    revert(this.section().nativeElement);
  }
}
