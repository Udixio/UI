import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-policy-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Motion],
  template: `
    <div class="flex flex-col items-start gap-4">
      <button #toggle type="button" [attr.aria-expanded]="open()" (click)="open.set(!open())">
        {{ open() ? 'Hide' : 'Show' }}
      </button>
      @if (open()) {
        <div
          udxMotion="slide"
          [udxMotionRestoreFocus]="toggle"
        >Saved</div>
      }
      <div udxMotion="slide" class="[--udx-motion:none]">Shown at once</div>
    </div>
  `,
})
export class MotionPolicyAngular {
  // The card is in the template while `open` is true; Angular keeps it until its exit has played.
  protected readonly open = signal(true);
}
