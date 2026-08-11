import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  Button,
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
  imports: [Button, FabMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid min-h-80 w-full content-between gap-8">
      <div
        class="rounded-xl border border-outline p-4"
        role="status"
        aria-live="polite"
      >
        <p class="text-title-medium">Menu: {{ open() ? 'open' : 'closed' }}</p>
        <p class="text-body-medium text-on-surface-variant">
          Last action: {{ lastAction() }}
        </p>
      </div>

      <div class="flex flex-wrap items-end justify-between gap-4">
        <udx-button
          [label]="open() ? 'Close from owner' : 'Open from owner'"
          variant="outlined"
          (click)="toggleMenu()"
        />
        <udx-fab-menu
          label="Create"
          [icon]="addIcon"
          [actions]="actions"
          size="large"
          extended
          [open]="open()"
          (openChange)="handleOpenChange($event)"
          (actionSelect)="handleAction($event)"
        />
      </div>
    </div>
  `,
})
export class FabMenuActionsAngular {
  protected readonly addIcon = iAdd;
  protected readonly actions: FabMenuAction[] = [
    { id: 'document', label: 'Edit document', icon: iEdit },
    { id: 'share', label: 'Share document', icon: iShare },
  ];
  protected readonly open = signal(false);
  protected readonly lastAction = signal('None');

  protected toggleMenu(): void {
    this.open.update((current) => !current);
  }

  protected handleOpenChange(open: boolean): void {
    this.open.set(open);
  }

  protected handleAction(event: FabMenuActionSelectEvent): void {
    this.lastAction.set(event.action.label);
  }
}
