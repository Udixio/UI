import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-layout-inline-style-angular',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full max-w-88 flex-col items-start gap-4">
      <!-- The layout does not observe the inline style: a new state plays the move, once the width is set. -->
      <div
        udxMotion="reflow"
        [udxMotionState]="wide()"
        [style.width]="wide() ? '100%' : '60%'"
        class="rounded-3xl bg-primary-container px-5 py-4 text-on-primary-container"
      >
        Widen me
      </div>
      <udx-button size="small" label="Widen" (click)="toggle()" />
    </div>
  `,
})
export class MotionLayoutInlineStyleAngular {
  protected readonly wide = signal(false);

  protected toggle(): void {
    this.wide.update((value) => !value);
  }
}
