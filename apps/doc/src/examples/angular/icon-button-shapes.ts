import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconButton } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-icon-button-shapes-angular',
  standalone: true,
  imports: [IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <lib-icon-button
          variant="filled"
          label="Narrow"
          [icon]="addIcon"
          shape="rounded"
          width="narrow"
        />
        <lib-icon-button
          variant="filled"
          label="Default"
          [icon]="addIcon"
          shape="rounded"
          width="default"
        />
        <lib-icon-button
          variant="filled"
          label="Wide"
          [icon]="addIcon"
          shape="rounded"
          width="wide"
        />
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <lib-icon-button
          variant="filled"
          label="Narrow"
          [icon]="addIcon"
          shape="squared"
          width="narrow"
        />
        <lib-icon-button
          variant="filled"
          label="Default"
          [icon]="addIcon"
          shape="squared"
          width="default"
        />
        <lib-icon-button
          variant="filled"
          label="Wide"
          [icon]="addIcon"
          shape="squared"
          width="wide"
        />
      </div>
    </div>
  `,
})
export class IconButtonShapesAngular {
  protected readonly addIcon = iAdd;
}
