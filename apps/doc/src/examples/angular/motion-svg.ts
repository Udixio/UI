import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import { defineMotion, getMotion } from '@udixio/motion';
import { morph } from '@udixio/motion/svg';

// A reveal: the check is drawn once, when it enters the view. play() draws it again from nothing.
defineMotion('check-draw', {
  verb: 'reveal',
  keyframes: [{ draw: 0 }, { draw: 1 }],
  timing: {
    duration: 'duration.extraLong1',
    easing: 'easing.standard',
  },
});
// The dot starts at the start of its offset path, and travels to its end.
defineMotion('travel', {
  verb: 'reveal',
  keyframes: [{ along: 0 }, { along: 1 }],
  timing: {
    duration: 'duration.extraLong2',
    easing: 'easing.standard',
  },
});

const PLAY = 'M8 5 L19 12 L8 19 Z';
const PAUSE = 'M7 5 H10 V19 H7 Z M14 5 H17 V19 H14 Z';

@Component({
  selector: 'docs-motion-svg-angular',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-6">
      <svg viewBox="0 0 48 48" class="size-20 text-primary" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
        <path
          #check
          udxMotion="check-draw"
          d="M44 24A20 20 0 1 1 4 24A20 20 0 1 1 44 24Z M16 25L22 31L33 19"
        />
      </svg>
      <button type="button" (click)="drawAgain()" class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary">
        Draw again
      </button>
      <span
        #dot
        udxMotion="travel"
        class="size-4 rounded-full bg-primary"
        style="offset-path: path('M16 72C96 0 192 0 272 72'); offset-distance: 100%"
      ></span>
      <button type="button" (click)="moveAgain()" class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary">
        Move again
      </button>
      <svg viewBox="0 0 24 24" class="size-16 text-primary" fill="currentColor" aria-hidden="true">
        <path #icon d="M8 5 L19 12 L8 19 Z" />
      </svg>
      <button type="button" [attr.aria-pressed]="pressed()" (click)="toggle()" class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary">
        Morph
      </button>
    </div>
  `,
})
export class MotionSvgAngular {
  @ViewChild('check', { static: true }) private readonly check!: ElementRef<SVGPathElement>;
  @ViewChild('dot', { static: true }) private readonly dot!: ElementRef<HTMLElement>;
  @ViewChild('icon', { static: true }) private readonly icon!: ElementRef<SVGPathElement>;

  protected readonly pressed = signal(false);
  private morphing?: ReturnType<typeof morph>;

  protected drawAgain(): void {
    getMotion(this.check.nativeElement, 'view')?.play();
  }

  protected moveAgain(): void {
    getMotion(this.dot.nativeElement, 'view')?.play();
  }

  protected toggle(): void {
    this.pressed.update((value) => !value);
    // A new morph continues from the shape the icon has reached.
    this.morphing?.cancel();
    this.morphing = morph(this.icon.nativeElement, this.pressed() ? PAUSE : PLAY, { timing: 'spring.default.spatial' });
  }
}
