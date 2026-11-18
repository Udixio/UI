import { Component, ElementRef, viewChild } from '@angular/core';
import { scrollTo } from '@udixio/motion/scroll';

@Component({
  selector: 'docs-motion-scroll-angular',
  standalone: true,
  template: `
    <div #box tabindex="0" class="h-56 overflow-y-auto">
      <section>Section one</section>
      <section #two tabindex="-1">Section two</section>
    </div>
    <button type="button" (click)="toTwo()">To section two</button>
  `,
})
export class MotionScrollAngular {
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly two = viewChild.required<ElementRef<HTMLElement>>('two');

  // The scroll follows a spring, and gives the focus to the heading when it arrives.
  protected toTwo(): void {
    scrollTo(this.two().nativeElement, {
      container: this.box().nativeElement,
      focus: true,
    });
  }
}
