import { AfterViewInit, Component, ElementRef, OnDestroy, viewChild } from '@angular/core';
import { animateStyle, createSpring, type SpringNumber } from '@udixio/motion/animate';

const STATES = [
  { backgroundColor: 'var(--color-primary-container)', borderRadius: '28px', clipPath: 'inset(0% round 28px)' },
  { backgroundColor: 'var(--color-tertiary-container)', borderRadius: '8px', clipPath: 'inset(6% 4% round 8px)' },
];

@Component({
  selector: 'docs-motion-animate-angular',
  standalone: true,
  template: `
    <div #card>Next state</div>
    <button type="button" (click)="next()">Next state</button>
    <input type="range" min="0" max="300" value="0" aria-label="Position" (input)="move($event)" />
    <span #dot></span>
  `,
})
export class MotionAnimateAngular implements AfterViewInit, OnDestroy {
  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');
  private readonly dot = viewChild.required<ElementRef<HTMLElement>>('dot');
  private offset?: SpringNumber;
  private state = 0;

  ngAfterViewInit(): void {
    const dot = this.dot().nativeElement;
    this.offset = createSpring(0, {
      timing: 'spring.default.spatial',
      onUpdate: (value) => (dot.style.translate = `${value}px 0`),
    });
  }

  ngOnDestroy(): void {
    this.offset?.stop();
  }

  // A single keyframe starts from the current style of the card.
  protected next(): void {
    this.state = (this.state + 1) % STATES.length;
    const card = this.card().nativeElement;
    animateStyle(card, STATES[this.state]!, {
      timing: 'spring.default.effects',
    });
  }

  protected move(event: Event): void {
    this.offset?.to(Number((event.target as HTMLInputElement).value));
  }
}
