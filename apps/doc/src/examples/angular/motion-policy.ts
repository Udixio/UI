import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-policy-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Motion],
  template: `
    <div class="flex flex-col items-start gap-4">
      <udx-button size="small" [aria-expanded]="open()" [label]="open() ? 'Hide' : 'Show'" (click)="open.set(!open())" />
      @if (open()) {
        <div
          udxMotion="slide"
          [udxMotionRestoreFocus]="restoreFocus"
        >Saved</div>
      }
      <div udxMotion="slide" class="motion-none">Shown at once</div>
    </div>
  `,
})
export class MotionPolicyAngular {
  // The card is in the template while `open` is true; Angular keeps it until its exit has played.
  protected readonly open = signal(true);
  private readonly toggle = viewChild.required(Button, { read: ElementRef });

  // The toggle is a Button: focus goes to the native button inside it, the element that takes focus.
  protected readonly restoreFocus = (): HTMLElement | null => this.toggle().nativeElement.querySelector('button');
}
