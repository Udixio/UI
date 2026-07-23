import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IconButton } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iStar } from '@udixio/icons-rounded-400/star';
import { iStarFilled } from '@udixio/icons-rounded-400/filled/star';

@Component({
  selector: 'docs-icon-button-states-angular',
  standalone: true,
  imports: [IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <lib-icon-button label="Add item" [icon]="addIcon" />
      <lib-icon-button
        label="Favorite"
        [icon]="starIcon"
        [pressedIcon]="starFilledIcon"
        variant="tonal"
        toggleable
        [pressed]="pressed()"
        (pressedChange)="pressed.set($event)"
      />
      <lib-icon-button label="Disabled action" [icon]="addIcon" disabled />
    </div>
  `,
})
export class IconButtonStatesAngular {
  protected readonly pressed = signal(false);
  protected readonly addIcon = iAdd;
  protected readonly starIcon = iStar;
  protected readonly starFilledIcon = iStarFilled;
}
