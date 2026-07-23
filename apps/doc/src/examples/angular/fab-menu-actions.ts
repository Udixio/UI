import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FabMenu,
  type FabMenuAction,
  type FabMenuActionSelectEvent,
} from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iEdit } from '@udixio/icons-rounded-400/edit';
import { iShare } from '@udixio/icons-rounded-400/share';

@Component({
  selector: 'docs-fab-menu-actions-angular',
  standalone: true,
  imports: [FabMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-64 items-end">
      <lib-fab-menu
        label="Create"
        [icon]="addIcon"
        [actions]="actions"
        (actionSelect)="handleAction($event)"
      />
    </div>
  `,
})
export class FabMenuActionsAngular {
  protected readonly addIcon = iAdd;
  protected readonly actions: FabMenuAction[] = [
    { id: 'document', label: 'Document', icon: iEdit },
    { id: 'share', label: 'Share', icon: iShare, href: '/share' },
  ];

  protected handleAction(event: FabMenuActionSelectEvent): void {
    console.log(event.action.id);
  }
}
