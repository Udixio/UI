import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'app-replay-two-ways',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-col items-start gap-4">
      <!-- play() replays an emphasis or a reveal: the press of the button. -->
      <span udxMotion="press" #press="udxMotion" class="inline-flex">
        <udx-button size="small" [label]="wide() ? 'Narrow' : 'Widen'" (click)="press.play(); widen(cardElement, card)" />
      </span>
      <div #cardElement udxMotion="reflow" #card="udxMotion" class="w-1/2 rounded-2xl bg-surface-container-high p-4">
        Now playing
      </div>
    </div>
  `,
})
export class ReplayTwoWays {
  protected readonly wide = signal(false);

  // An inline style is not observed: set it, then ask the layout binding to move now.
  protected widen(element: HTMLElement, card: Motion): void {
    this.wide.update((value) => !value);
    element.style.width = this.wide() ? '100%' : '50%';
    card.bindingOf('layout')?.play();
  }
}
