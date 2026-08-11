import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconButton } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-icon-button-variants-angular',
  standalone: true,
  imports: [IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <udx-icon-button label="Standard" [icon]="addIcon" variant="standard" />
      <udx-icon-button label="Filled" [icon]="addIcon" variant="filled" />
      <udx-icon-button label="Tonal" [icon]="addIcon" variant="tonal" />
      <udx-icon-button label="Outlined" [icon]="addIcon" variant="outlined" />
    </div>
  `,
})
export class IconButtonVariantsAngular {
  protected readonly addIcon = iAdd;
}
