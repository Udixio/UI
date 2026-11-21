import { Component, ElementRef, viewChild } from '@angular/core';
import { scrollTo } from '@udixio/motion/scroll';
import { Button } from '@udixio/ui-angular';

@Component({
  selector: 'docs-motion-scroll-angular',
  standalone: true,
  imports: [Button],
  template: `
    <div class="flex w-full max-w-72 flex-col items-start gap-4">
      <div
        #box
        tabindex="0"
        class="h-56 w-full overflow-y-auto rounded-3xl bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        <section class="flex h-56 items-center px-5 text-title-medium text-on-surface">Section one</section>
        <section #two tabindex="-1" class="flex h-56 items-center px-5 text-title-medium text-on-surface">Section two</section>
      </div>
      <udx-button size="small" label="To section two" (click)="toTwo()" />
    </div>
  `,
})
export class MotionScrollAngular {
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly two = viewChild.required<ElementRef<HTMLElement>>('two');

  // The scroll follows a spring, and gives the focus to the section when it arrives.
  protected toTwo(): void {
    scrollTo(this.two().nativeElement, {
      container: this.box().nativeElement,
      focus: true,
    });
  }
}
