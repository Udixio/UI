import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-layout-angular',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-motion-scope class="flex w-full max-w-88 flex-col">
      <!-- A class is observed: the layout moves the player from its old size to its new one, with no call of your own. -->
      <div
        udxMotion="reflow"
        [attr.data-open]="open() || null"
        class="flex h-16 flex-row items-center gap-3 rounded-3xl bg-surface-container-high px-3 data-[open]:h-64 data-[open]:flex-col data-[open]:items-start data-[open]:justify-between data-[open]:gap-4 data-[open]:p-5"
      >
        <span class="size-10 shrink-0 rounded-xl bg-tertiary-container"></span>
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="text-title-medium text-on-surface">Night drive</span>
          <span class="text-body-small text-on-surface-variant">Low tide</span>
        </span>
        <udx-button size="small" [label]="open() ? 'Close' : 'Open'" (click)="toggle()" />
      </div>
    </div>
  `,
})
export class MotionLayoutAngular {
  protected readonly open = signal(false);

  protected toggle(): void {
    this.open.update((value) => !value);
  }
}
