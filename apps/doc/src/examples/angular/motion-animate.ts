import { AfterViewInit, Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { animateStyle, createSpring, type SpringNumber } from '@udixio/motion/animate';
import { Button, Slider } from '@udixio/ui-angular';

const STATES = [
  { backgroundColor: 'var(--color-primary-container)', borderRadius: '28px', clipPath: 'inset(0% round 28px)' },
  { backgroundColor: 'var(--color-tertiary-container)', borderRadius: '8px', clipPath: 'inset(6% 4% round 8px)' },
];

@Component({
  selector: 'docs-motion-animate-angular',
  standalone: true,
  imports: [Button, Slider],
  template: `
    <div class="flex w-full max-w-72 flex-col items-start gap-4">
      <div
        #card
        class="flex h-24 w-full items-center justify-center rounded-3xl bg-surface-container-high text-title-medium text-on-surface"
      >Next state</div>
      <udx-button size="small" label="Next state" (click)="next()" />
      <udx-slider
        aria-label="Position"
        [min]="0"
        [max]="300"
        [step]="1"
        [value]="position()"
        (valueChange)="move($event)"
      />
      <span #dot class="block size-4 rounded-full bg-primary"></span>
    </div>
  `,
})
export class MotionAnimateAngular implements AfterViewInit, OnDestroy {
  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');
  private readonly dot = viewChild.required<ElementRef<HTMLElement>>('dot');
  private offset?: SpringNumber;
  private state = 0;
  // The slider is controlled: its value is the position the spring was sent to.
  protected readonly position = signal(0);

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

  protected move(value: number): void {
    this.position.set(value);
    this.offset?.to(value);
  }
}
