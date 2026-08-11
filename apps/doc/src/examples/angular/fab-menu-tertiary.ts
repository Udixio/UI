import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FabMenu, type FabMenuAction } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-fab-menu-tertiary-angular',
  standalone: true,
  imports: [FabMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[28rem] w-full items-end justify-center">
      <udx-fab-menu
        label="Compose"
        [icon]="addIcon"
        [actions]="actions"
        variant="tertiary"
        size="large"
      />
    </div>
  `,
})
export class FabMenuTertiaryAngular {
  protected readonly addIcon = iAdd;
  protected readonly actions: FabMenuAction[] = [
    { id: 'message', label: 'New message' },
    { id: 'reply', label: 'Reply' },
    { id: 'forward', label: 'Forward' },
    { id: 'archive', label: 'Archive' },
    { id: 'reminder', label: 'Add reminder' },
  ];
}
