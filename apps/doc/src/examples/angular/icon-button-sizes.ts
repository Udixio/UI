import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconButton } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-icon-button-sizes-angular',
  standalone: true,
  imports: [IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <lib-icon-button
        variant="filled"
        label="Extra small"
        [icon]="addIcon"
        size="xSmall"
      />
      <lib-icon-button variant="filled" label="Small" [icon]="addIcon" size="small" />
      <lib-icon-button
        variant="filled"
        label="Medium"
        [icon]="addIcon"
        size="medium"
      />
      <lib-icon-button variant="filled" label="Large" [icon]="addIcon" size="large" />
      <lib-icon-button
        variant="filled"
        label="Extra large"
        [icon]="addIcon"
        size="xLarge"
      />
    </div>
  `,
})
export class IconButtonSizesAngular {
  protected readonly addIcon = iAdd;
}
