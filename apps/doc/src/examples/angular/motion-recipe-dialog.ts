import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  signal,
  viewChild,
} from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-recipe-dialog-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Motion],
  template: `
    <!-- In a page, the layer is fixed and inert goes on the rest of the page. -->
    <div class="relative w-full max-w-96">
      <div [inert]="open()" class="flex min-h-64 flex-col items-start gap-3 rounded-3xl bg-surface-container p-5">
        <p class="text-label-large text-on-surface-variant">Drafts</p>
        <h3 class="text-title-medium text-on-surface">Spring launch notes</h3>
        <p class="text-body-medium text-on-surface-variant">Edited two hours ago</p>
        <udx-button #opener size="small" variant="tonal" label="Delete draft" (click)="open.set(true)" />
      </div>
      <!-- Angular keeps each element until its exit has played. -->
      @if (open()) {
        <div udxMotion="fade" class="absolute inset-0 rounded-3xl bg-black/32" (click)="open.set(false)"></div>
      }
      @if (open()) {
        <div
          udxMotion="scale"
          [udxMotionRestoreFocus]="openerButton"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recipe-dialog-title-angular"
          aria-describedby="recipe-dialog-text-angular"
          (keydown.escape)="open.set(false)"
          class="absolute inset-0 m-auto flex h-fit w-[calc(100%-1rem)] max-w-72 flex-col gap-4 rounded-3xl bg-surface-container-high p-6"
        >
          <h2 id="recipe-dialog-title-angular" class="text-title-large text-on-surface">Delete this draft?</h2>
          <p id="recipe-dialog-text-angular" class="text-body-medium text-on-surface-variant">
            Spring launch notes will be removed from your drafts.
          </p>
          <div class="flex flex-wrap justify-end gap-2">
            <udx-button #cancel size="small" variant="text" label="Cancel" (click)="open.set(false)" />
            <udx-button size="small" variant="text" label="Delete" (click)="open.set(false)" />
          </div>
        </div>
      }
    </div>
  `,
})
export class MotionRecipeDialogAngular {
  protected readonly open = signal(false);
  private readonly opener = viewChild.required('opener', { read: ElementRef });
  private readonly cancel = viewChild('cancel', { read: ElementRef });

  // The exit starts with focus inside: it goes back to the button that opened the dialog.
  protected readonly openerButton = () => this.opener().nativeElement.querySelector('button');

  constructor() {
    // On open, focus goes to the safe choice of the dialog.
    afterRenderEffect(() => {
      this.cancel()?.nativeElement.querySelector('button')?.focus();
    });
  }
}
