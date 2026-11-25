import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { navigate, type NavigationDirection } from '@udixio/motion/page';
import { Button } from '@udixio/ui-angular';

const TRACKS = ['Night Drive', 'Signal Fire', 'Open Road'];

@Component({
  selector: 'docs-motion-page-transitions-player-angular',
  standalone: true,
  imports: [Button],
  template: `
    <div class="flex w-full max-w-72 flex-col items-start gap-4">
      @if (view() === 'library') {
        <ul class="flex w-full flex-col gap-2">
          @for (track of tracks; track track) {
            <li class="rounded-2xl bg-surface-container-highest px-4 py-3 text-body-large text-on-surface">
              {{ track }}
            </li>
          }
        </ul>
      } @else {
        <div class="flex w-full flex-col gap-2 rounded-3xl bg-tertiary-container p-5 text-on-tertiary-container">
          <span class="text-label-large">Now playing</span>
          <span class="text-title-large">Night Drive</span>
        </div>
      }
      <udx-button size="small" [label]="label()" (click)="go()" />
    </div>
  `,
})
export class MotionPageTransitionsPlayerAngular {
  private readonly changes = inject(ChangeDetectorRef);
  protected readonly tracks = TRACKS;
  protected readonly view = signal<'library' | 'player'>('library');
  protected readonly label = signal('Open the player');

  // The change of view runs inside the transition. detectChanges draws the new view before the browser takes its picture.
  protected go(): void {
    const toPlayer = this.view() === 'library';
    const direction: NavigationDirection = toPlayer ? 'forward' : 'back';
    void navigate(() => {
      this.view.set(toPlayer ? 'player' : 'library');
      this.label.set(toPlayer ? 'Back to the library' : 'Open the player');
      this.changes.detectChanges();
    }, { direction });
  }
}
