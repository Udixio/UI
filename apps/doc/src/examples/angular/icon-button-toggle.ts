import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IconButton } from '@udixio/ui-angular';
import { iStar } from '@udixio/icons-rounded-400/star';
import { iStarFilled } from '@udixio/icons-rounded-400/filled/star';

@Component({
  selector: 'docs-icon-button-toggle-angular',
  standalone: true,
  imports: [IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <lib-icon-button
        label="Favorite (uncontrolled)"
        [icon]="starIcon"
        [pressedIcon]="starFilledIcon"
        variant="tonal"
        toggleable
        defaultPressed
      />
      <lib-icon-button
        label="Favorite (controlled)"
        [icon]="starIcon"
        [pressedIcon]="starFilledIcon"
        variant="tonal"
        toggleable
        [pressed]="pressed()"
        (pressedChange)="pressed.set($event)"
      />
    </div>
  `,
})
export class IconButtonToggleAngular {
  protected readonly pressed = signal(false);
  protected readonly starIcon = iStar;
  protected readonly starFilledIcon = iStarFilled;
}
