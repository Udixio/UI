import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { defineMotion } from '@udixio/motion';
import { Button, Motion } from '@udixio/ui-angular';

// A spring token: the fast spatial spring moves the panel.
defineMotion('panel-in', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
  timing: 'spring.fast.spatial',
});

// A curve: a duration token and an easing token, in place of a spring.
defineMotion('banner-in', {
  verb: 'appear',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
  timing: { duration: 'duration.medium2', easing: 'easing.standard' },
});

@Component({
  selector: 'docs-motion-tokens-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Motion],
  template: `
    <div class="flex flex-col items-start gap-4">
      @if (open()) {
        <div udxMotion="panel-in">Moves on a spring</div>
        <div udxMotion="banner-in">Fades on a curve</div>
      }
      <udx-button size="small" [label]="open() ? 'Hide' : 'Show'" (click)="open.set(!open())" />
    </div>
  `,
})
export class MotionTokensAngular {
  // Angular keeps each element until its exit has played, when the condition turns false.
  protected readonly open = signal(true);
}
