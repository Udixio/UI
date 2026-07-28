import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FabMenu, type FabMenuAction } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-fab-menu-primary-angular',
  standalone: true,
  imports: [FabMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[28rem] w-full items-end justify-center">
      <lib-fab-menu
        label="Create"
        [icon]="addIcon"
        [actions]="actions"
        size="large"
      />
    </div>
  `,
})
export class FabMenuPrimaryAngular {
  protected readonly addIcon = iAdd;
  protected readonly actions: FabMenuAction[] = [
    { id: 'document', label: 'New document' },
    { id: 'folder', label: 'New folder' },
    { id: 'upload', label: 'Upload file' },
    { id: 'scan', label: 'Scan document' },
    { id: 'import', label: 'Import content' },
  ];
}
