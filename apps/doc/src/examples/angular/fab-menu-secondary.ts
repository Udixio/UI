import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FabMenu, type FabMenuAction } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-fab-menu-secondary-angular',
  standalone: true,
  imports: [FabMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[28rem] w-full items-end justify-center">
      <lib-fab-menu
        label="Add content"
        [icon]="addIcon"
        [actions]="actions"
        variant="secondary"
        size="large"
        extended
      />
    </div>
  `,
})
export class FabMenuSecondaryAngular {
  protected readonly addIcon = iAdd;
  protected readonly actions: FabMenuAction[] = [
    { id: 'note', label: 'Add note' },
    { id: 'photo', label: 'Take photo' },
    { id: 'attachment', label: 'Attach file' },
    { id: 'recording', label: 'Record audio' },
    { id: 'location', label: 'Add location' },
  ];
}
