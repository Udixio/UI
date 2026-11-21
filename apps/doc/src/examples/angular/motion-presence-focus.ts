import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

// A panel that leaves with focus inside it: its exit gives focus back to the button that opened it.
@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <udx-button
        #opener
        size="small"
        variant="tonal"
        label="Filters"
        [aria-expanded]="open()"
        (click)="open.set(true)"
      />
      @if (open()) {
        <!-- Focus is on Close: the exit moves it to the Filters button before the panel turns inert. -->
        <div udxMotion="fade" [udxMotionRestoreFocus]="openerButton">
          <udx-button size="small" variant="text" label="Close" (click)="open.set(false)" />
        </div>
      }
    </div>
  `,
})
export class Filters {
  protected readonly open = signal(false);
  private readonly opener = viewChild.required('opener', { read: ElementRef });

  // The opener is a Button: focus goes to the native button inside it, the element that takes focus.
  protected readonly openerButton = (): HTMLButtonElement | null => this.opener().nativeElement.querySelector('button');
}
